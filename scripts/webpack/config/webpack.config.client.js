const baseConfig = require('./webpack.config.base');
const merge = require("webpack-merge");
const manifestPlugin = require('webpack-manifest-plugin');

module.exports = merge(baseConfig, {
  entry: {
    main: './src/client/index.js'
  },
  target: 'web',
  output: {
    filename: "client.js"
  },
  plugins: [
    new manifestPlugin()
  ]
});
