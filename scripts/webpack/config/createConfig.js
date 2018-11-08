module.exports = (target = 'web', env = 'dev') => {
  const IS_PROD = env === 'prod';
  // 设置 TARGET 和 NODE_ENV 控制 webpack的config内容
  process.env.NODE_ENV = IS_PROD ? 'production' : 'development';
  process.env.TARGET = target;
  if (target === 'web') {
    return require('./webpack.config.client')(target, env);
  } else {
    return require('./webpack.config.server')(target, env);
  }
};
