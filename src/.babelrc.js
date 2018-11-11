module.exports = {
  presets: [
    [
      '@babel/env',
      {
        modules: 'commonjs',
        targets: {
          node: 'current'
        }
      }
    ],
    '@babel/react'
  ],
  plugins: [
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-syntax-dynamic-import',
    'react-loadable/babel',
    'babel-plugin-macros'
  ]
};
