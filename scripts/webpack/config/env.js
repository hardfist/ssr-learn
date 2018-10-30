const paths = require("./paths");
const getClientEnv = target => {
  const raw = {
    appManifest: paths.appManifest,
    appBuild: paths.appBuild
  };
  const stringified = Object.keys(raw).reduce((env, key) => {
    env[`process.env.${key}`] = JSON.stringify(raw[key]);
    return env;
  }, {});
  return {
    raw,
    stringified
  };
};
module.exports = {
  getClientEnv
};
