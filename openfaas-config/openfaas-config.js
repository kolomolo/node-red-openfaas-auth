const prepareSuperagent = require("../common/prepareSuperagent");
const configEndpoint = require("../common/configEndpoint");

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
    this.username = settings.username;
    this.password = settings.password;
    this.useAuth = true;
  }
  const serverResolver = configEndpoint(RED);
  RED.nodes.registerType("openfaas-config", FaasConfigNode);
  RED.httpAdmin.get(
    "/openfaas-config",
    RED.auth.needsPermission("openfaas-function.read"),
    serverResolver
  );
};
