const should = require("should/as-function");
const configEndpoint = require("./configEndpoint");
const sinon = require("sinon");
const nock = require("nock");

describe("configEndpoint", function() {
  beforeEach(function() {
    nock.disableNetConnect();
    nock("http://example.com")
      .get("/system/functions")
      .reply(200, '[{"name": "foo"}]');
  });

  afterEach(function() {
    nock.cleanAll();
  });

  it("should work with proper configuration", function(done) {
    const fakeRespond = { json: sinon.fake() };
    const fakeGetNode = sinon.fake.returns({
      protocol: "http",
      host: "example.com",
      port: 80
    });
    const fakeRED = { nodes: { getNode: fakeGetNode } };
    const server = configEndpoint(fakeRED);
    server({ query: { server: "'test" } }, fakeRespond).then(() => {
      should(fakeRespond.json.calledWith(["foo"])).be.true();
      done();
    });
  });

  it("should throw an error with wrong configuration", function(done) {
    const fakeRespond = { json: sinon.fake() };
    const fakeGetNode = sinon.fake.returns({
      protocol: "http",
      host: "wrong-example.com",
      port: 80
    });
    const fakeRED = { nodes: { getNode: fakeGetNode } };
    const server = configEndpoint(fakeRED);
    server({ query: { server: "'test" } }, fakeRespond).catch(error => {
      should(error).be.ok();
      done();
    });
  });
});
