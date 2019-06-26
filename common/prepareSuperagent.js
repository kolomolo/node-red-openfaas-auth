const axios = require("axios");

module.exports = server => {
  const requestUrl = `${server.protocol}://${server.host}:${server.port}/${server.endpoint}`;
  const headers = {};
  const auth = server.useAuth
    ? { username: server.username, password: server.password }
    : undefined;
  if (server.auth === "jwt") {
    headers["authorization"] = `Bearer ${server.jwt}`;
  } else if (server.auth == "api") {
    headers[server.header] = server.api;
  }

  const agent = auth
    ? axios.create({
        headers,
        auth
      })
    : axios.create({ headers });

  return { agent, requestUrl };
};
