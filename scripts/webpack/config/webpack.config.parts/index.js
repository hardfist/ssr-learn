module.exports = (target, env) => {
  return {
    load_css_module: require('./load_css')(target,env).load_css_module,
    load_css: require('./load_css')(target,env).load_css,
    load_js: require('./load_js')(target,env).load_js
  };
};
