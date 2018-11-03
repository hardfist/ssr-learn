const paths = require("./paths");
const autoprefixer = require("autoprefixer");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
module.exports = (target, env) => {
  const IS_NODE = target === "node";
  const IS_WEB = target === "web";
  const IS_PROD = env === "prod";
  const IS_DEV = env === "dev";
  console.log("is_node:", IS_NODE, IS_PROD);
  const loadJS = ({ include, exclude }) => ({
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
  const postCssOptions = {
    ident: "postcss", // https://webpack.js.org/guides/migrating/#complex-options
    plugins: () => [
      require("postcss-flexbugs-fixes"),
      autoprefixer({
        browsers: [
          ">1%",
          "last 4 versions",
          "Firefox ESR",
          "not ie < 9" // React doesn't support IE8 anyway
        ],
        flexbox: "no-2009"
      })
    ]
  };
  const loadCSS = ({ include, exclude }) => {
    let css_loader_config = {};
    const postcss_loader = {
      loader: "postcss-loader",
      options: postCssOptions
    };
    if (IS_NODE) {
      // servre编译只需要能够解析css，并不需要实际的生成css文件
      css_loader_config = [
        {
          loader: "css-loader",
          options: {
            importLoaders: 1
          }
        },
        postcss_loader
      ];
    } else if (IS_DEV) {
      // client 编译且为development下，使用style-loader以便支持热更新
      css_loader_config = [
        "style-loader",
        {
          loader: "css-loader",
          options: {
            importLoaders: 1
          }
        },
        postcss_loader
      ];
    } else {
      // client编译且为production下，需要将css抽取出单独的css文件,并且需要对css进行压缩
      css_loader_config = [
        MiniCssExtractPlugin.loader,
        {
          loader: require.resolve("css-loader"),
          options: {
            importLoaders: 1,
            modules: false, // 不支持css module
            minimize: true // 压缩编译后生成的css文件
          }
        },
        {
          loader: require.resolve("postcss-loader"),
          options: postCssOptions
        }
      ];
    }
    return {
      // client && prod 下开启extractCss插件
      plugins: [
        !IS_NODE &&
          IS_PROD &&
          new MiniCssExtractPlugin({
            filename: "static/css/[name].[contenthash:8].css",
            chunkFilename: "static/css/[name].[contenthash:8].chunk.css",
            allChunks: true // 不对css进行code spliting，包含所有的css, 对css的code splitting 暂时还有些问题
          })
      ].filter(x => x),
      module: {
        rules: [
          {
            test: /\.css$/,
            use: css_loader_config
          }
        ]
      }
    };
  };

  return {
    loadCSS,
    loadJS
  };
};
