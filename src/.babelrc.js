module.exports = api => {
  const env = api.env();
  console.log('env:', env);
  return {
    presets: [
      [
        '@babel/env',
        {
          modules: 'commonjs',
          useBuiltIns: 'usage'
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
};
