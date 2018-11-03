# REACT 服务端渲染最全教程

[TOC]

本系列将从零到一讲述如何搭建一个支持多页面+ 单页面 + Code Split + SSR + i18n + Redux 的 HackerNews。重点讲述构建复杂 SSR 系统碰到的各种问题。所有中间过程都可以在 codesandbox 上查看。
首先编写一个最基础的 SSR 渲染页面,我们服务端使用 Koa ，前端使用 React。

### 创建 React 组件

```jsx
// src/client/app.js
import React from "react";
export default class App extends React.Component {
  render() {
    return <div>welcome to ssr world</div>;
  }
}
```

### 与服务端集成

```jsx
// src/server/server.js
import Koa from "koa";
import React from "react";
import { renderToString } from "react-dom/server";
import App from "../client/app";

const app = new Koa();
app.use(async ctx => {
  const markup = renderToString(<App />);
  ctx.body = `
   <html>
      <head>
        <title>SSR-demo1</title>
      </head>

      <body>
        <div id="root">${markup}</div>
      </body>
    </html>
  `;
});
export async function startServer() {
  app.listen(process.env.PORT, () => {
    console.log("start server at port:", process.env.PORT);
  });
}

// src/server/app.js
import { startServer } from "./server";
startServer();
```

此时的实现十分简陋，仅能够实现最基础的服务端渲染 React 组件，[在线示例:demo1](https://codesandbox.io/s/31v6pq0zk5)。
虽然代码十分简单，但是整个项目的编译+部署的过程仍然存在一些值得注意的地方。
整个项目的目录结构如下所示

```sh
.
├── README.md
├── now.json // now部署配置
├── output
│   └── server.js // 前后端编译生成代码
├── package-lock.json
├── package.json
├── sandbox.config.json // sandbox部署配置
├── src
│   ├── .babelrc //babel配置
│   ├── client
│   │   └── app.js // 前端组件代码
│   └── server
│       ├── app.js // server运维相关逻辑
│       └── server.js // server相关业务逻辑
└── webpack.config.js // 编译配置
```

我们使用 webpack 编译服务端代码，webpack 配置和一般前端代码的配置无太大区别

```js
const path = require("path");
const nodeExternals = require("webpack-node-externals");
const serverConfig = {
  entry: "./src/server/app.js", // entry指向 server的入口
  mode: "development",
  target: "node", // 使用类node环境（使用node.js的require来加载chunk)
  externals: [nodeExternals()], // webpack打包不打包node_modules里的模块
  output: {
    path: path.join(__dirname, "output"),
    filename: "server.js",
    publicPath: "/"
  },
  module: {
    rules: [{ test: /\.(js)$/, use: "babel-loader" }]
  }
};

module.exports = [serverConfig];
```

与前端编译不同的地方在于

1. target 为 node:使用 require 去加载 chunk
2. externals: 编译时不编译 node_modules 的模块，与前端编译不同，前端编译时需要将 node_modules 里模块打包而服务端则时在运行时加载 node_modules 里的模块，好处包括：
   - 减小编译文件内容加快编译速度。
   - 防止重复执行同一 node_module 下模块， 假如该模块存在副作用则可能会造成错误，一个常见的场景是 client 和 server 会公用一些模块例如 react-loadable，由于 node 的 require 缓存是基于路径的，如果对 client 进行了编译但没对 server 进行编译，这回导致 client 引用了 react-loadble 和 server 引用了 react-loadable,但是 client 对 react-loadable 进行了打包，导致 react-loadable 二次加载，然而 react-loadable 的加载具有副作用，导致 react-loadable 的部分功能失效。

我们同样需要进行 babel 配置，因为使用了react， 所以需要对babel进行配置

```js
module.exports = {
  presets: [
    [
      "@babel/env",
      {
        modules:false // module交给webpack处理，支持treeshake
        targets: {
          node: "current"
        }
      }
    ],
    "@babel/react"
  ]
};
```

这里值得注意的是`@babel/env`的 module 设置为 false，可以更好地支持 treeshaking，减小最终的打包大小。

### hydrate

[在线示例 2-hydrate](https://codesandbox.io/s/9469r7xxlo)
现在我们的页面只是一个纯 html 页面，并不支持任何交互，为了支持用户交互我们需要对页面进行 hydrate 操作。
此时我们不仅需要编译 server 的代码，还需要编译 client 的代码。因此我们需要两份配置文件，但是 client 和 server 的编译配置有很多共同的地方，
因此考虑使用 webpack-merge 进行复用。此时有三个配置文件

```jsx
// scripts/webpack/config/webpack.config.base.js
const path = require("path");
const webpack = require("webpack");
const baseConfig = {
  context: process.cwd(),
  mode: "production",
  output: {
    path: path.join(root, "output"),
    filename: "server.js",
    publicPath: "/"
  },
  module: {
    rules: [{ test: /\.(js)$/, use: "babel-loader" }]
  }
};

module.exports = baseConfig;
```

```jsx
// scripts/webpack/config/webpack.config.server.js
module.exports = merge(baseConfig, {
  mode: "development",
  devtool: "source-map",
  entry: "./src/server/app.js",
  target: "node",
  output: {
    filename: "server.js",
    libraryTarget: "commonjs2"
  },
  externals: [nodeExternals()]
});
```

```jsx
// scripts/webpack/config/webpack.config.client.js
module.exports = merge(baseConfig, {
  entry: {
    main: "./src/client/index.js"
  },
  target: "web",
  output: {
    filename: "[name].[chunkhash:8].js" // 设置hash用于缓存更新
  },
  plugins: [
    new manifestPlugin() // server端用于获取生成的前端文件名
  ]
});
```

build 后再 output 里生成信息如下：

```sh
output
├── main.f695bcf8.js # client编译文件
├── manifest.json # manifest 文件
├── server.js # server编译文件
└── server.js.map # server编译文件的sourcemap
```

对于生成环境的前端代码，需要包含版本信息，以便用于版本更新，我们用 chunkhash 作为其版本号，每次代码更新后都会生成新的 hash 值，因此
server 端需要获取每次编译后生成的版本信息，以用于下发正确的版本。这里有两种处理方式：

1. 使用 html-webpack-plugin 生成带有 js 版本的 html 文件，server 端直接渲染生成的 html
2. server 端通过 webpack-manifest-plugin 生成编译后的 manifest 信息，server 在自己使用的模板里插入对应的 js 代码。
   第一种方式比较简单，且对于各种资源注入有很好的支持，但是这样 html-webpack-plugin 接管了 server 端的渲染逻辑，且只能生成 html 文件，server 端比较难以扩展，第二种方式需要用户自己处理各种资源注入逻辑，但是有良好的扩展性，可以轻松支持多种模板。
   我们此处使用第一种方式。

### 变量注入

 有些场景我们需要在代码中注入一些变量，例如

- 一份代码需要运行在不同的环境，如 development，staging，production 环境，需要在代码中根据不同的环境处理不同的逻辑
- 很多 node_moudles 会根据不同的 process.env.NODE_ENV 读取不同的代码，如 react 在 process.node.NODE_ENV === 'production'下会读取的是压缩后的代码，这样能保证线上的代码体积打包更小。
- 不同的用户会下发不同的  参数，如在 AB 测情况下，server 会给不同用户下发  不同的参数，代码中根据不同的  参数，呈现不同的结果。
  变量注入可以分为运行时注入和编译时注入

####  运行时注入

前端的运行是可以通过读取 server 端下发的 window.xxx 变量实现，比较简单，
服务端变量注入通常有两种方式配置文件  和配置环境变量。

##### 配置文件

我们可以为不同环境配置不同的  配置文件,如 eggjs 的多环境配置就是通过不同的  配置文件实现的根据 EGG_SERVER_ENV 读取不同的配置文件，其 config 如下所示,

```sh
config
|- config.default.js
|- config.prod.js
|- config.unittest.js
`- config.local.js
```

配置文件有其局限性，因为配置文件通常是和代码一起提交到代码仓库里的，不能在配置文件里存放一些机密信息，如数据库账号和密码等，

##### 环境变量

配置文件难以在运行时进行热更新，如我们需要对某些服务进行降级，需要在运行时替换掉某个变量的值。这些情况可以考虑使用环境变量进行变量注入。环境变量注入通常有如下如下用途：

1. 结合配置文件使用，根据环境变量读取不同的配置文件
2. 运行时控制:环境变量通过配置中心配置，代码运行时定时读取更新的配置变量，可以用于手动的降级控制。

有多个地方可以注入环境变量:

1. 代码注入
   ```js
    process.env.NODE_ENV = 'production'
    ....
   ```

````
2. 启动命令时注入
 ```js
 // package.json
 ....
 "scripts": {
  "build": "NODE_ENV=production webpack"
 }
 ....
````

3. 运行环境注入，大多数的 ci 平台都支持配置环境

#### 编译时注入

借助于 webpack 和 babel 强大的功能我们可以实现编译时注入变量，相比于运行时注入，编译时注入可以实现运行时注入无法实现的功能

1. 配合 webpack 的 Tree Shaking 功能，我们可以在编译时把无关代码删除
2. 可以在代码中实现 DSL，编译时替换为实际的 js 代码。

有两种方法可以实现编译时注入

1. [DefinePlugin](https://webpack.docschina.org/plugins/define-plugin/),DefinePlugin 允许创建一个在编译时可以配置的全局变量。这可能会不同的环境变量编译出不同版本的代码。一个最简单的场景就是通过 process.env.NODE_ENV 控制加载的版本,babel-plugin-transform-define 也可以实现相同功能。
2. babel-plugin-marco 可以实现更加复杂的编译时替换功能，例如我们可以通过 babel-plugin-macro 扩充支持 import 的语法，使得其可以支持`import files * from 'dir/*'`之类的批量导入，这在很多场景下都非常有作用。

在本例子中我们通过 process.env 和 definePlugin 向项目中注入`appBuild`和`appManifest`两个变量，其默认值在`path.js`里定义

```js
// scripts/webpack/config/paths.js
const path = require("path");
const fs = require("fs");
const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = relativePath => path.resolve(appDirectory, relativePath);

module.exports = {
  appManifest: resolveApp("output/manifest.json"),
  appBuild: resolveApp("output")
};
```

#### dotenv

[12factory](https://12factor.net/zh_cn/config) 提倡在环境中存储配置，我们使用 dotenv 来实现在环境中存储配置。这样方便我们在不同的环境下
对覆盖进行覆盖操作。根据[rails_dotenv](https://github.com/bkeepers/dotenv#what-other-env-files-can-i-use)的规范，我们会一次加载`${paths.dotenv}.${NODE_ENV}.local`,`${paths.dotenv}.${NODE_ENV}`,`${paths.dotenv}.local`,`paths.dotenv`配置文件，前者会覆盖后者的配置。如在本例子中我们可以在.env.production 里覆盖设置`PORT=4000`覆盖默认端口。

#### 收敛配置

为了方便项目的扩展，我们将原来在项目中硬编码的一些常量配置进行统一处理，大部分和路径相关的配置收敛到`scripts/webpack/config/paths`目录下。

```js
const path = require("path");
const fs = require("fs");
const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = relativePath => path.resolve(appDirectory, relativePath);

module.exports = {
  appManifest: resolveApp("output/manifest.json"), // client编译manifest
  appBuild: resolveApp("output"), //client && server编译生成目录
  appSrc: resolveApp("src"), // cliet && server source dir
  appPath: resolveApp("."), // 项目根目录
  dotenv: resolveApp(".env"), // .env文件
  appClientEntry: resolveApp("src/client/entry"), // client 的webpack入口
  appServerEntry: resolveApp("src/server/app") // server 的webpack入口
};
```

#### 配置插件化

随着项目越来越复杂，我们的 webpack 配置也会变的越来越复杂，且难以阅读和扩展，除了将 webpack 的配置拆分为 client 和 server 我们可以考虑将 wepback 的配置进行插件化，将每个扩展功能通过插件的形式集成到原有的 webpack 配置中。如本例子中可以将 js 编译的部分抽取出来

```js
// webpack.config.parts.js
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
// webpack.config.js
const commonConfig = merge([...parts.loadJS({ include: paths.appSrc })]);
```

### css 支持

[在线示例-css]()
我们下面增加对 css 的支持，上步中我们已将对 js 编译提取到了`webpack.config.parts`里，同理我们也把对 css 的处理外置到`webpack.config.parts`里，css 的处理比 js 的处理复杂得多。不同于 js，node 环境对 js 有原生的支持，然而对于 css，node 并不支持导入 css 模块。
对 css 的处理分为三种情形

1. server 对 CSS 的处理：最简单的处理方式是忽略掉 css 文件，因此我们可以考虑只使用`css-loader`去处理 css 模块。
2. client 在 dev 模式下对 css 的处理：client 的 dev 模式下需要支持 css 的热更新，因此需要对使用`style-loader`去处理 css 模块。
3. client 在 prod 模式下对 css 的处理：client 的 prod 模式下，需要将 css 文件抽取为独立的 css 文件，并对 css 文件进行压缩，因此需要`mini-css-extract-plugin`进行处理。

```js
// webpack.config.parts.js
const postCssOptions = {
  ident: "postcss",
  plugins: () => [
    require("postcss-flexbugs-fixes"),
    autoprefixer({
      browsers: [">1%", "last 4 versions", "Firefox ESR", "not ie < 9"],
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
```

prod 模式下，我们还需要在 html 里引入 css，使用 manifest 即可轻松实现。

```js
ctx.body = `
   <html>
      <head>
        <title>SSR with RR</title>
        <link rel="stylesheet" href="${manifest["main.css"]}"> # 添加对css的支持
      </head>

      <body>
        <div id="root">${markup}</div>
      </body>
      <script src="${manifest["main.js"]}"></script>
    </html>
  `;
```
