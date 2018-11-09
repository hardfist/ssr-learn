module.exports = {
  presets: [
    [
      "@babel/env",
      {
        modules: 'commonjs',
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

