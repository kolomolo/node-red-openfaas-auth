const prepareSuperagent = require("../common/prepareSuperagent");

function configEndpoint(RED) {
  return async function(request, respond) {
    const serverNodeID = request.query.server.replace(/['"]+/g, "");
    const server = RED.nodes.getNode(serverNodeID);
    const { agent } = prepareSuperagent(server);
    const response = await agent.get(
      `${server.protocol}://${server.host}:${server.port}/system/functions`
    );
    respond.json(response.data.map(el => el.name));
  };
}

module.exports = configEndpoint;
