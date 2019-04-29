module.exports = function(RED) {
  function FaasConfigNode(settings) {
    RED.nodes.createNode(this, settings);
    this.protocol = settings.protocol;
    this.host = settings.host;
    this.port = settings.port;
    this.endpoint = settings.endpoint;
    this.auth = settings.auth;
    this.jwt = settings.jwt;
    this.header = settings.header;
    this.api = settings.api;
    this.parse = settings.parse;
  }

  RED.nodes.registerType("openfaas-config", FaasConfigNode);
};
