const path = require("path");
const paths = require("./paths");
const webpack = require("webpack");
const parts = require("./webpack.config.parts");
const merge = require("webpack-merge");
const root = process.cwd();
const { getClientEnv } = require("./env");
const env = getClientEnv();

const baseConfig = merge(
  {
    context: process.cwd(),
    mode: "production",
    output: {
      path: path.join(root, "output"),
      filename: "server.js",
      publicPath: "/"
    },
    plugins: [new webpack.DefinePlugin(env.stringified)]
  },
  parts.loadJS({ include: paths.appSrc })
);

module.exports = baseConfig;
