const paths = require('../paths');
console.log('entry:', paths.appClientDir);
module.exports = () => {
  const alias = () => {
    return {
      resolve: {
        modules: ['node_modules', paths.appClientDir]
      }
    };
  };
  return alias;
};
