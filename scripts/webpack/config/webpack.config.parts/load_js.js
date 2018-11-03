module.exports = (target, env) => {
  const load_js = ({ include, exclude }) => ({
    module: {
      rules: [
        {
          test: /\.(js|jsx|mjs)$/,
          use: "babel-loader",
          include,
          exclude
        }
      ]
    }
  });
  return {
    load_js
  };
};
