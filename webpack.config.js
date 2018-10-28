// webpack.config.js

const path = require("path");
const nodeExternals = require("webpack-node-externals");
const serverConfig = {
  entry: "./src/server/app.js",
  mode: 'production',
  target: "node",
  externals: [nodeExternals()],
  output: {
    path: path.join(__dirname, 'output'),
    filename: "server.js",
    publicPath: "/"
  },
  module: {
    rules: [{ test: /\.(js)$/, use: "babel-loader" }]
  }
};

module.exports = [serverConfig];
