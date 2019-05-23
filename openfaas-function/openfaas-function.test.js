const should = require("should/as-function");
const faasNode = require("./openfaas-function.js");
const faasConfigNode = require("../openfaas-config/openfaas-config.js");
const graylogConfigNode = require("node-red-contrib-graylog/graylog-config/graylog-config");
const helper = require("node-red-node-test-helper");
const nock = require("nock");
const mockudp = require("mock-udp");

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
  api: null,
  header: null
};
const FaasFunction = {
  id: "n2",
  type: "openfaas-function",
  name: "Have Been I Pwned",
  function: "havebeenipwned",
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
    beforeEach(function() {
      nock.disableNetConnect();
      nock("http://faas.com:8080")
        .post("/function/havebeenipwned")
        .reply(200, '{"found": 123}');
    });

    afterEach(function() {
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

    it("shouldn't load without configuration", function(done) {
      const flow = [FaasFunction];
      helper.load(faasNode, flow, function() {
        const testNode = helper.getNode("n1");
        should(testNode).not.exist;
        done();
      });
    });
    it("should work with proper configuration", function(done) {
      const flow = [FaasConfig, FaasFunction, FaasHelper];
      helper.load([faasNode, faasConfigNode], flow, function() {
        const testNode = helper.getNode("n2");
        const resultNode = helper.getNode("n3");
        resultNode.on("input", function(msg) {
          should(msg.payload).deepEqual({ found: 123 });
          done();
        });
        testNode.receive({ payload: "test" });
      });
    });
  });
  describe("test arguments", function() {
    beforeEach(function() {
      nock.disableNetConnect();
      nock("http://faas.com:8080")
        .post("/function/havebeenipwned")
        .reply(function(_path, requestBody) {
          const body = JSON.parse(requestBody);
          return body.args.mail === "test@mail.com"
            ? "TEST_SUCCEDED"
            : "TEST_FAILED";
        });
    });

    afterEach(function() {
      nock.cleanAll();
    });

    it("shouldn't work without arguments", function(done) {
      const flow = [
        FaasConfig,
        { ...FaasFunction, args: { mail: "test2@mail.com" } },
        FaasHelper
      ];
      helper.load([faasNode, faasConfigNode], flow, function() {
        const testNode = helper.getNode("n2");
        const resultNode = helper.getNode("n3");
        resultNode.on("input", function(msg) {
          should(msg.payload).equal("TEST_FAILED");
          done();
        });
        testNode.receive({ payload: "test" });
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
          should(msg.payload).equal("TEST_SUCCEDED");
          done();
        });
        testNode.receive({ payload: "test" });
      });
    });
  });

  describe("API Key functionality", function() {
    beforeEach(function() {
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

    afterEach(function() {
      nock.cleanAll();
    });

    it("should work with proper configuration", function(done) {
      const flow = [
        {
          ...FaasConfig,
          auth: "api",
          api: "StrongRandomAPIKey",
          header: "apikey"
        },
        FaasFunction,
        FaasHelper
      ];
      helper.load([faasNode, faasConfigNode], flow, function() {
        const testNode = helper.getNode("n2");
        const resultNode = helper.getNode("n3");
        resultNode.on("input", function(msg) {
          should(msg.payload).deepEqual({ found: 123 });
          done();
        });
        testNode.receive({ payload: "test" });
      });
    });

    it("shouldn't work with wrong configuration", function(done) {
      const flow = [
        { ...FaasConfig, auth: "api", apikey: null, header: "apikey" },
        FaasFunction,
        FaasHelper
      ];
      helper.load([faasNode, faasConfigNode], flow, function() {
        const testNode = helper.getNode("n2");
        testNode.on("call:error", function(error) {
          should(error).exist;
          done();
        });
        testNode.receive({ payload: "test" });
      });
    });
  });

  describe("JSON Web Token functionality", function() {
    beforeEach(function() {
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

    afterEach(function() {
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
          should(msg.payload).deepEqual({ found: 123 });
          done();
        });
        testNode.receive({ payload: "test" });
      });
    });

    it("shouldn't work with wrong configuration", function(done) {
      const flow = [FaasConfig, FaasFunction, FaasHelper];
      helper.load([faasNode, faasConfigNode], flow, function() {
        const testNode = helper.getNode("n2");
        testNode.on("call:error", function(error) {
          should(error).exist;
          done();
        });
        testNode.receive({ payload: "test" });
      });
    });
  });
  describe("Graylogging functionality", function() {
    beforeEach(function() {
      nock.disableNetConnect();
      nock("http://faas.com:8080")
        .post("/function/havebeenipwned")
        .reply(500, "function error!");
    });

    afterEach(function() {
      nock.cleanAll();
    });

    it("should log with proper configuration", function(done) {
      const scope = mockudp("localhost:1234");
      const flow = [
        {
          type: "graylog-config",
          id: "n4",
          host: "localhost",
          port: "1234"
        },
        {
          ...FaasConfig,
          graylog: "n4"
        },
        FaasFunction
      ];
      helper.load(
        [faasNode, faasConfigNode, graylogConfigNode],
        flow,
        function() {
          const testNode = helper.getNode("n2");
          testNode.on("call:error", () => {
            // I really dislike this, but can't think of any other way :/
            //
            // Timeout is here to wait for FaasFunction to
            // send log over UDP to our mock server
            //
            setTimeout(() => {
              scope.done();
              done();
            }, 200);
          });
          testNode.receive({ payload: "test" });
        }
      );
    });
  });
});
