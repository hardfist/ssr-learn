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
  ],
  plugins: [
    '@babel/plugin-proposal-class-properties'
  ]
};

