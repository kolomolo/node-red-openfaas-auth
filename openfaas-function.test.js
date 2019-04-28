const faasNode = require("./openfaas-function.js");
const faasConfigNode = require("./openfaas-config.js");
const helper = require("node-red-node-test-helper");

helper.init(require.resolve("node-red"));

beforeAll(done => {
  helper.startServer(done);
});

afterAll(done => {
  helper.unload();
  helper.stopServer(done);
});

test("node shouldn't mount without configuration", () => {
  const flow = [{ id: "n1", type: "openfaas-function", name: "test-function" }];
  helper.load(faasNode, flow, () => {
    const testNode = helper.getNode("n1");
    expect(testNode).toBeNull();
  });
});

test("should mount with configuration", () => {
  // TODO
  // const flow = [
  //   {
  //     id: "n1",
  //     type: "openfaas-config",
  //     host: "faas.example.com",
  //     post: "8080"
  //   },
  //   {
  //     id: "n2",
  //     type: "openfaas-function",
  //     name: "havebeenipwned",
  //     server: "n1",
  //     wires: [["n3"]]
  //   },
  //   { id: "n3", type: "helper" }
  // ];
  // helper.load([faasNode, faasConfigNode], flow, () => {
  //   const testNode = helper.getNode("n2");
  //   const resultNode = helper.getNode("n3");
  //   resultNode.on("input", msg => {
  //     msg.toHaveProperty("payload", "test succeded");
  //     done();
  //   });
  //   testNode.receive({ payload: "havebeenipwned" });
  // });
});

test("should work with proper configuration", () => {
  // TODO
});

test("should use JWT to auth with proper configuration", () => {
  // TODO
});

test("should use API Key to auth with proper configuration", () => {
  // TODO
});

test("should exit gratefully with wrong configuration", () => {
  // TODO
});
