const prepareSuperagent = require("../common/prepareSuperagent");

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

  RED.nodes.registerType("openfaas-config", FaasConfigNode);
  RED.httpAdmin.get(
    "/openfaas-config",
    RED.auth.needsPermission("openfaas-function.read"),
    function(request, respond) {
      const serverNodeID = request.query.server.replace(/['"]+/g, "");
      const server = RED.nodes.getNode(serverNodeID);
      const { agent } = prepareSuperagent(server);
      agent
        .get(
          `${server.protocol}://${server.host}:${server.port}/system/functions`
        )
        .then(response => {
          respond.json(response.data.map(el => el.name));
        })
        .catch(error => {
          console.error(error); // eslint-disable-line no-console
          /*
           *   can't use this.warn in here because it's not a node
           *   so just log this into stdout
           */
        });
    }
  );
};
