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

test("node should mount", () => {
  const flow = [
    {
      id: "n1",
      type: "openfaas-config",
      protocol: "http",
      host: "localhost",
      port: "8080"
    }
  ];
  helper.load(faasConfigNode, flow, () => {
    const testNode = helper.getNode("n1");
    // expect(testNode).not.toBeNull();
  });
});
