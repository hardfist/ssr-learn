const baseConfig = require('./webpack.config.base');
const nodeExternals = require('webpack-node-externals');
const webpack = require('webpack');
const merge = require('webpack-merge');
const paths = require('./paths');

module.exports = (target, env) =>
  merge(baseConfig(target, env), {
    node: {
      __console: false,
      __dirname: false,
      __filename: false
    },
    mode: 'development',
    devtool: 'source-map',
    entry: paths.appServerEntry,
    target: 'node',
    output: {
      filename: 'server.js',
      libraryTarget: 'commonjs2'
    },
    externals: [nodeExternals()],
    plugins: [
      new webpack.DefinePlugin({
        __BROWSER__: JSON.stringify(false),
        __NODE__: JSON.stringify(true)
      })
    ]
  });
