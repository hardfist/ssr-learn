module.exports = {
  presets: [
    [
      "@babel/env",
      {
        modules: false,
        targets: {
          node: "current"
        }
      }
    ],
    "@babel/react"
  ]
};

