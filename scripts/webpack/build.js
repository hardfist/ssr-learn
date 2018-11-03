process.env.NODE_ENV = "production";
require('./config/env');
require("colors");
process.on('unhandledRejection', err => {
  console.error('error:', err);
  throw err;
});
//const fs = require("fs-extra");
const path = require("path");
const createConfig = require("./config/createConfig");
const formatWeebpackMessages = require("react-dev-utils/formatWebpackMessages");
const webpack = require("webpack");
async function build() {
  //fs.emptyDirSync(path.join(process.cwd(), "output"));
  const clientConfig = createConfig("web", "prod");
  const serverConfig = createConfig("node", "web");
  console.log("Production build");
  console.log("Compiling client....");
  try {
    await compile(clientConfig);
  } catch (err) {
    console.error(`Build client error: ${err.message}`.red);
    process.exit(1);
  }
  console.log("Build client success".green);
  console.log("Compiling server....");
  try {
    await compile(serverConfig);
  } catch (err) {
    console.error(`Build server error: ${err.message}`.red);
    process.exit(1);
  }
  console.log("Build server success".green);
}
function compile(config) {
  let compiler;
  try {
    compiler = webpack(config);
  } catch (e) {
    console.error("Failed to compile.", e.message);
    process.exit(1);
  }
  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) {
        reject(err);
      } else {
        const messages = formatWeebpackMessages(stats.toJson({}, true));
        if (messages.errors.length) {
          return reject(new Error(messages.errors.join("\n\n")));
        } else {
          resolve(stats);
        }
      }
    });
  });
}
build();
