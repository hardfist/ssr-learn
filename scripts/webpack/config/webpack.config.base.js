const path = require('path');
const paths = require('./paths');
const webpack = require('webpack');
const merge = require('webpack-merge');
const root = process.cwd();
const { getClientEnv } = require('./env');
const envs = getClientEnv();

const baseConfig = (target, env) => {
  const parts = require('./webpack.config.parts')(target, env);
  return merge(
    {
      context: process.cwd(),
      mode: 'production',
      output: {
        path: path.join(root, 'output'),
        filename: 'server.js',
        publicPath: '/'
      },
      plugins: [new webpack.DefinePlugin(envs.stringified)]
    },
    parts.load_css_module({ exclude: [paths.appBuild] }),
    parts.load_css({
      include: [paths.appSrc],
      exclude: [paths.appBuild, /\.module\.css$/]
    }),
    parts.load_js({ exclude: paths.appBuild }),
    parts.alias()
  );
};

module.exports = baseConfig;
