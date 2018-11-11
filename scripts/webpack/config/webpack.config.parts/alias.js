const paths = require('../paths');
module.exports = () => {
  const alias = () => {
    return {
      resolve: {
        modules: ['node_modules', paths.appClientDir],
        alias: {
          shared: paths.appSharedDir
        }
      }
    };
  };
  return alias;
};
