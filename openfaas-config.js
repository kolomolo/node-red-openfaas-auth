module.exports = function(RED) {
  function FaasConfigNode(settings) {
    RED.nodes.createNode(this, settings);
    this.protocol = settings.protocol;
    this.host = settings.host;
    this.port = settings.port;
    this.endpoint = settings.endpoint;
    this.authType = settings.authType;
    this.jwtToken = settings.jwtToken;
    this.apiKey = settings.apiKey;
    this.parse = settings.parse;
  }

  RED.nodes.registerType("openfaas-config", FaasConfigNode);
};
