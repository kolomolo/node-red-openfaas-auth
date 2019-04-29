const superagent = require("superagent");

module.exports = function(RED) {
  function FaasNode(config) {
    RED.nodes.createNode(this, config);

    this.server = RED.nodes.getNode(config.server);
    if (!this.server) {
      throw "You need to select server first";
    }

    this.on("input", async msg => {
      const agent = superagent.agent();
      if (this.server.auth === "jwt") {
        agent.set("Authorization", `Bearer ${this.server.jwt}`);
      } else if (this.server.auth == "api") {
        agent.set(this.server.header, this.server.api);
      }

      const REQUEST_URL = `${this.server.protocol}://${this.server.host}:${
        this.server.port
      }/${this.server.endpoint}`;

      agent
        .post(`${REQUEST_URL}/${this.name}`)
        .send(msg.payload)
        .then(response => {
          const payload = this.server.parse ? response.body : response.text;
          this.send(payload);
        })
        .catch(error => this.warn(error));
    });
  }

  RED.nodes.registerType("openfaas-function", FaasNode);
};
