const path = require("path");
const webpack = require('webpack');
const root = process.cwd();
const { getClientEnv } = require('./env');
const env = getClientEnv();
const baseConfig = {
  context: process.cwd(),
  mode: "production",
  output: {
    path: path.join(root,'output'),
    filename: "server.js",
    publicPath: "/"
  },
  module: {
    rules: [{ test: /\.(js)$/, use: "babel-loader" }]
  },
  plugins: [
    new webpack.DefinePlugin(env.stringified)
  ]
};

module.exports = baseConfig;
