const should = require("should/as-function");
const faasNode = require("./openfaas-function.js");
const faasConfigNode = require("../openfaas-config/openfaas-config.js");
const helper = require("node-red-node-test-helper");
const nock = require("nock");

helper.init(require.resolve("node-red"));

const FaasConfig = {
  id: "n1",
  type: "openfaas-config",
  host: "faas.com",
  port: "8080",
  protocol: "http",
  endpoint: "function",
  auth: "none",
  jwt: null,
  api: "StrongRandomAPIKey",
  header: "apikey"
};
const FaasFunction = {
  id: "n2",
  type: "openfaas-function",
  name: "havebeenipwned",
  server: "n1",
  wires: [["n3"]]
};
const FaasHelper = {
  id: "n3",
  type: "helper"
};

describe("openfaas-function node", function() {
  beforeEach(function(done) {
    helper.startServer(done);
  });

  afterEach(function(done) {
    helper.unload().then(function() {
      helper.stopServer(done);
    });
  });

  describe("basic functionality", function() {
    before(function() {
      nock.disableNetConnect();
      nock("http://faas.com:8080")
        .post("/function/havebeenipwned")
        .reply(function(_, requestBody) {
          return requestBody.args.mail === "test@mail.com"
            ? "test@mail.com argument"
            : '{"found": 123}';
        });
    });

    after(function() {
      nock.cleanAll();
    });

    it("should load with configuration", function(done) {
      const flow = [FaasConfig, FaasFunction, FaasHelper];
      helper.load([faasNode, faasConfigNode], flow, function() {
        const testNode = helper.getNode("n2");
        should(testNode).have.ownProperty("name");
        done();
      });
    });

    it("should work with arguments", function(done) {
      const flow = [
        FaasConfig,
        { ...FaasFunction, args: { mail: "test@mail.com" } },
        FaasHelper
      ];
      helper.load([faasNode, faasConfigNode], flow, function() {
        const testNode = helper.getNode("n2");
        const resultNode = helper.getNode("n3");
        resultNode.on("input", function(msg) {
          should(msg.payload).equal("test@mail.com argument");
          done();
        });
        testNode.receive({ payload: "test" });
      });
    });

    it("shouldn't load without configuration", function(done) {
      const flow = [FaasFunction];
      helper.load(faasNode, flow, function() {
        const testNode = helper.getNode("n1");
        should(testNode).not.exist;
        done();
      });
    });
  });

  describe("API Key functionality", function() {
    before(function() {
      nock.disableNetConnect();
      nock("http://faas.com:8080", {
        reqheaders: {
          apikey: headerValue => {
            return headerValue === "StrongRandomAPIKey";
          }
        }
      })
        .post("/function/havebeenipwned")
        .reply(200, '{"found": 123}');

      nock("http://faas.com:8080")
        .post("/function/havebeenipwned")
        .reply(403, "Not authorized");
    });

    after(function() {
      nock.cleanAll();
    });

    it("should work with proper configuration", function(done) {
      const flow = [FaasConfig, FaasFunction, FaasHelper];
      helper.load([faasNode, faasConfigNode], flow, function() {
        const testNode = helper.getNode("n2");
        const resultNode = helper.getNode("n3");
        resultNode.on("input", function(msg) {
          should(msg.payload).equal('{"found": 123}');
          done();
        });
        testNode.receive({ payload: "test" });
      });
    });

    it("shouldn't work with wrong configuration", function(done) {
      const flow = [{ ...FaasConfig, apikey: null }, FaasFunction, FaasHelper];
      helper.load([faasNode, faasConfigNode], flow, function() {
        const testNode = helper.getNode("n2");
        testNode.on("call:warn", function(event) {
          should(event.args[0].error.status).equal(403);
          done();
        });
        testNode.receive({ payload: "test" });
      });
    });
  });

  describe("JSON Web Token functionality", function() {
    before(function() {
      nock.disableNetConnect();
      nock("http://faas.com:8080", {
        reqheaders: {
          authorization: headerValue => {
            const token =
              "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
              "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ" +
              ".SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
            return headerValue === `Bearer ${token}`;
          }
        }
      })
        .post("/function/havebeenipwned")
        .reply(200, '{"found": 123}');

      nock("http://faas.com:8080")
        .post("/function/havebeenipwned")
        .reply(403, "Not authorized");
    });

    after(function() {
      nock.cleanAll();
    });

    it("should work with proper configuration", function(done) {
      const flow = [
        {
          ...FaasConfig,
          auth: "jwt",
          jwt:
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
        },
        FaasFunction,
        FaasHelper
      ];
      helper.load([faasNode, faasConfigNode], flow, function() {
        const testNode = helper.getNode("n2");
        const resultNode = helper.getNode("n3");
        resultNode.on("input", function(msg) {
          should(msg.payload).equal('{"found": 123}');
          done();
        });
        testNode.receive({ payload: "test" });
      });
    });

    it("shouldn't work with wrong configuration", function(done) {
      const flow = [FaasConfig, FaasFunction, FaasHelper];
      helper.load([faasNode, faasConfigNode], flow, function() {
        const testNode = helper.getNode("n2");
        testNode.on("call:warn", function(event) {
          should(event.args[0].error.status).equal(403);
          done();
        });
        testNode.receive({ payload: "test" });
      });
    });
  });
});
