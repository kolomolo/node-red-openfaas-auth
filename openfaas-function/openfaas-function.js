const prepareSuperagent = require("../common/prepareSuperagent");

module.exports = function(RED) {
  function FaasNode(config) {
    RED.nodes.createNode(this, config);

    this.server = RED.nodes.getNode(config.server);
    if (!this.server) {
      throw "You need to select server first";
    }
    this.function = config.function;
    this.args = config.args;

    this.on("input", async msg => {
      const { agent, requestUrl } = prepareSuperagent(this.server);
      const request = { payload: null, args: {} };
      request["args"] = this.args || {};
      request["payload"] = msg.payload;
      try {
        const response = await agent.post(
          `${requestUrl}/${this.function}`,
          request
        );
        msg.payload = response.data;
        this.send(msg);
      } catch (error) {
        this.warn(
          `${this.function} - ${JSON.stringify(request)} resulted in ${error}`
        );
      }
    });
  }

  RED.nodes.registerType("openfaas-function", FaasNode);
};
