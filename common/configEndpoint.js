const prepareSuperagent = require("../common/prepareSuperagent");

function configEndpoint(RED) {
  return async function(request, respond) {
    const serverNodeID = request.query.server.replace(/['"]+/g, "");
    const server = RED.nodes.getNode(serverNodeID);
    const { agent } = prepareSuperagent(server);
    try {
      const response = await agent.get(
        `${server.protocol}://${server.host}:${server.port}/system/functions`
      );
      respond.json(response.data.map(el => el.name));
    } catch (error) {
      console.error(error); // eslint-disable-line no-console
      /*
       *   can't use this.warn in here because it's not a node
       *   so just log this into stdout
       */
    }
  };
}

module.exports = configEndpoint;
