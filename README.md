# REACT服务端渲染最全教程
[TOC]

本系列将从零到一讲述如何搭建一个支持多页面+ 单页面 + Code Split + SSR + i18n + Redux 的 HackerNews。重点讲述构建复杂 SSR 系统碰到的各种问题。所有中间过程都可以在codesandbox上查看。
首先编写一个最基础的 SSR 渲染页面,我们服务端使用 Koa ，前端使用 React。

### 创建React组件

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
此时的实现十分简陋，仅能够实现最基础的服务端渲染React组件，[在线示例:demo1](https://codesandbox.io/s/31v6pq0zk5)。
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
我们使用webpack编译服务端代码，webpack配置和一般前端代码的配置无太大区别
```js
const path = require("path");
const nodeExternals = require("webpack-node-externals");
const serverConfig = {
  entry: "./src/server/app.js", // entry指向 server的入口
  mode: 'development',
  target: "node", // 使用类node环境（使用node.js的require来加载chunk)
  externals: [nodeExternals()], // webpack打包不打包node_modules里的模块
  output: {
    path: path.join(__dirname, 'output'),
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
1. target为node:使用require去加载chunk
2. externals: 编译时不编译node_modules的模块，与前端编译不同，前端编译时需要将node_modules里模块打包而服务端则时在运行时加载node_modules里的模块，好处包括：
    + 减小编译文件内容加快编译速度。
    + 防止重复执行同一node_module下模块，假如该模块存在副作用则可能会造成错误，一个常见的场景是client和server会公用一些模块例如react-loadable，由于node的require缓存是基于路径的，如果对client进行了编译但没对server进行编译，这回导致client引用了react-loadble和server引用了react-loadable,但是client对react-loadable进行了打包，导致react-loadable二次加载，然而react-loadable的加载具有副作用，导致react-loadable的部分功能失效。

我们同样需要进行babel配置，因为使用了react，所以需要对babel进行配置
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
这里值得注意的是`@babel/env`的module设置为false，可以更好地支持treeshaking，减小最终的打包大小。
### hydrate
现在我们的页面只是一个纯html页面，并不支持任何交互，为了支持用户交互我们需要对页面进行hydrate操作。
此时我们不仅需要编译server的代码，还需要编译client的代码。因此我们需要两份配置文件，但是client和server的编译配置有很多共同的地方，
因此考虑使用webpack-merge进行复用。此时有三个配置文件
```jsx
// scripts/webpack/config/webpack.config.base.js
const path = require("path");
const webpack = require('webpack');
const baseConfig = {
  context: process.cwd(),
  mode: "production",
  output: {
    path: path.join(root,'output'),
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
  devtool: 'source-map',
  entry: "./src/server/app.js",
  target: "node",
  output: {
    filename: 'server.js',
    libraryTarget: 'commonjs2'
  },
  externals: [nodeExternals()]
});

```
```jsx
// scripts/webpack/config/webpack.config.client.js
module.exports = merge(baseConfig, {
  entry: {
    main: './src/client/index.js'
  },
  target: 'web',
  output: {
    filename: "[name].[chunkhash:8].js" // 设置hash用于缓存更新
  },
  plugins: [
    new manifestPlugin()
  ]
});
```
