const baseConfig = require("./webpack.config.base");
const merge = require("webpack-merge");
const manifestPlugin = require("webpack-manifest-plugin");
const paths = require("./paths");
module.exports = (target, env) =>
  merge(baseConfig(target, env), {
    entry: {
      main: paths.appClientEntry
    },
    target: "web",
    output: {
      filename: "[name].[chunkhash:8].js"
    },
    plugins: [new manifestPlugin()]
  });
