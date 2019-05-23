const prepareSuperagent = require("../common/prepareSuperagent");
const Gelf = require("gelf");

module.exports = function(RED) {
  function FaasNode(config) {
    RED.nodes.createNode(this, config);

    this.server = RED.nodes.getNode(config.server);
    if (!this.server) {
      throw "You need to select server first";
    }
    const graylog = RED.nodes.getNode(this.server.graylog);
    if (graylog) {
      this.gelf = new Gelf({
        graylogPort: graylog.port,
        graylogHostname: graylog.host,
        connection: graylog.connection,
        maxChunkSizeWan: graylog.maxChunkSizeWan,
        maxChunkSizeLan: graylog.maxChunkSizeLan
      });
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
        if (this.gelf) {
          this.gelf.emit(
            "gelf.log",
            `${this.function} - ${JSON.stringify(request)} resulted in ${error}`
          );
        }
        this.error(
          `${this.function} - ${JSON.stringify(request)} resulted in ${error}`
        );
      }
    });
  }

  RED.nodes.registerType("openfaas-function", FaasNode);
};
