module.exports = function(RED) {
  async function FaasConfigNode(settings) {
    RED.nodes.createNode(this, settings);
    this.host = settings.host;
    this.port = settings.port;
    this.functionsEndpoint = settings.functionsEndpoint;
    this.authType = settings.authType;
    this.jwtToken = settings.jwtToken;
    this.apiKey = settings.apiKey;
  }

  RED.nodes.registerType("lower-case", FaasConfigNode);
};
