const superagent = require("superagent");

module.exports = function(RED) {
  async function FaasNode(config) {
    RED.nodes.createNode(this, config);
    this.on("input", msg => {
      this.send(msg);
    });
  }

  RED.nodes.registerType("lower-case", FaasNode);
};
