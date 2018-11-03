const paths = require("./paths");
exports.loadCSS = () => ({});
exports.loadJS = ({ include, exclude }) => ({
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
