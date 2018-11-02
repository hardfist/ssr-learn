const paths = require("./paths");
const NODE_ENV = process.env.NODE_ENV;
const fs = require("fs");
const dotenv = require("dotenv");
if (!NODE_ENV) {
  throw new Error(
    "!The NODE_ENV environtment variable is required but not defined"
  );
}
// 一次加载.env.production.local, .env.production, .env.local, .env，前者优先级最高
const dotenvFiles = [
  `${paths.dotenv}.${NODE_ENV}.local`,
  `${paths.dotenv}.${NODE_ENV}`,
  `${paths.dotenv}.local`,
  paths.dotenv
];
dotenvFiles.forEach(dotenvFile => {
  if (fs.existsSync(dotenvFile)) {
    dotenv.config({
      path: dotenvFile
    });
  }
});
const getClientEnv = target => {
  const raw = {
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: process.env.PORT || 3000,
    PUBLIC_PATH: process.env.PUBLIC_PATH || "/",
    appManifest: paths.appManifest,
    appBuild: paths.appBuild
  };
  const stringified = Object.keys(raw).reduce((env, key) => {
    env[`process.env.${key}`] = JSON.stringify(raw[key]);
    return env;
  }, {});
  console.log('raw:', raw);
  return {
    raw,
    stringified
  };
};
module.exports = {
  getClientEnv
};
