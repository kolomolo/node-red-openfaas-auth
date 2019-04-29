const superagent = require("superagent");

const prepareSuperagent = server => {
  const requestUrl = `${server.protocol}://${server.host}:${server.port}/${
    server.endpoint
  }`;

  const agent = superagent.agent();
  if (server.auth === "jwt") {
    agent.set("Authorization", `Bearer ${server.jwt}`);
  } else if (server.auth == "api") {
    agent.set(server.header, server.api);
  }

  return { agent, requestUrl };
};

module.exports = function(RED) {
  function FaasNode(config) {
    RED.nodes.createNode(this, config);

    this.server = RED.nodes.getNode(config.server);
    if (!this.server) {
      throw "You need to select server first";
    }

    this.on("input", async msg => {
      const { agent, requestUrl } = prepareSuperagent(this.server);
      this.debug(agent, requestUrl);
      agent
        .post(`${requestUrl}/${this.name}`)
        .send(msg.payload)
        .then(response => {
          const payload = this.server.parse ? response.body : response.text;
          this.send(payload);
        })
        .catch(error => this.warn(error.response));
    });
  }

  RED.nodes.registerType("openfaas-function", FaasNode);
};
