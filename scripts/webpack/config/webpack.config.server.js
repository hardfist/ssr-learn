const baseConfig = require('./webpack.config.base');
const nodeExternals = require("webpack-node-externals");
const merge = require("webpack-merge");
const paths = require('./paths');

module.exports = merge(baseConfig, {
  mode: "development",
  devtool: 'source-map',
  entry: paths.appServerEntry,
  target: "node",
  output: {
    filename: 'server.js',
    libraryTarget: 'commonjs2'
  },
  externals: [nodeExternals()]
});
