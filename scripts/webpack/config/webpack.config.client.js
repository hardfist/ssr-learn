const baseConfig = require('./webpack.config.base');
const merge = require("webpack-merge");
const manifestPlugin = require('webpack-manifest-plugin');

module.exports = merge(baseConfig, {
  entry: {
    main: './src/client/index.js'
  },
  target: 'web',
  output: {
    filename: "[name].[chunkhash:8].js"
  },
  plugins: [
    new manifestPlugin()
  ]
});
