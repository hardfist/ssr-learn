const baseConfig = require('./webpack.config.base');
const merge = require('webpack-merge');
const webpack = require('webpack');
const manifestPlugin = require('webpack-manifest-plugin');
const { ReactLoadablePlugin } = require('react-loadable/webpack');
const paths = require('./paths');
module.exports = (target, env) =>
  merge(baseConfig(target, env), {
    entry: {
      main: paths.appClientEntry
    },
    target: 'web',
    mode: 'development',
    devtool: 'source-map',
    output: {
      filename: '[name].[chunkhash:8].js',
      chunkFilename: '[name].chunk.[chunkhash:8].js',
    },
    optimization: {
      splitChunks: {
        chunks: 'all'
      }
    },
    plugins: [
      new manifestPlugin(),
      new webpack.DefinePlugin({
        __BROWSER__: JSON.stringify(true),
        __NODE__: JSON.stringify(false)
      }),
      new ReactLoadablePlugin({
        filename: paths.appLoadableManifest
      })
    ]
  });
