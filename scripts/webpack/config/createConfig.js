module.exports = (target = "web", env = "dev") => {
  const IS_NODE = target === "node";
  const IS_WEB = target === "web";
  const IS_PROD = env === "prod";
  const IS_DEV = env === "dev";
  process.env.NODE_ENV = IS_PROD;
  const serverConfig = require("./webpack.config.server");
  const clientConfig = require("./webpack.config.client");
  if (target === "web") {
    return clientConfig;
  } else {
    return serverConfig;
  }
};
