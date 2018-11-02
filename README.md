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
[在线示例2-hydrate](https://codesandbox.io/s/9469r7xxlo)
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
    new manifestPlugin() // server端用于获取生成的前端文件名
  ]
});
```
build后再output里生成信息如下：
```sh
output
├── main.f695bcf8.js # client编译文件
├── manifest.json # manifest 文件
├── server.js # server编译文件
└── server.js.map # server编译文件的sourcemap
```
对于生成环境的前端代码，需要包含版本信息，以便用于版本更新，我们用chunkhash作为其版本号，每次代码更新后都会生成新的hash值，因此
server端需要获取每次编译后生成的版本信息，以用于下发正确的版本。这里有两种处理方式：
1. 使用html-webpack-plugin生成带有js版本的html文件，server端直接渲染生成的html
2. server端通过webpack-manifest-plugin生成编译后的manifest信息，server在自己使用的模板里插入对应的js代码。
第一种方式比较简单，且对于各种资源注入有很好的支持，但是这样html-webpack-plugin接管了server端的渲染逻辑，且只能生成html文件，server端比较难以扩展，第二种方式需要用户自己处理各种资源注入逻辑，但是有良好的扩展性，可以轻松支持多种模板。
我们此处使用第一种方式。

### 变量注入
有些场景我们需要在代码中注入一些变量，例如
+ 一份代码需要运行在不同的环境，如development，staging，production环境，需要在代码中根据不同的环境处理不同的逻辑
+ 很多node_moudles会根据不同的process.env.NODE_ENV读取不同的代码，如react在process.node.NODE_ENV === 'production'下会读取的是压缩后的代码，这样能保证线上的代码体积打包更小。
+ 不同的用户会下发不同的参数，如在AB测情况下，server会给不同用户下发不同的参数，代码中根据不同的参数，呈现不同的结果。
变量注入可以分为运行时注入和编译时注入
#### 运行时注入
前端的运行是可以通过读取server端下发的window.xxx变量实现，比较简单，
服务端变量注入通常有两种方式配置文件和配置环境变量。
##### 配置文件
我们可以为不同环境配置不同的配置文件,如eggjs的多环境配置就是通过不同的配置文件实现的根据EGG_SERVER_ENV读取不同的配置文件，其config如下所示,
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
2. 启动命令时注入
   ```js
   // package.json
   ....
   "scripts": {
    "build": "NODE_ENV=production webpack"
   }
   ....
   ```
3. 运行环境注入，大多数的ci平台都支持配置环境
#### 编译时注入

借助于webpack和babel强大的功能我们可以实现编译时注入变量，相比于运行时注入，编译时注入可以实现运行时注入无法实现的功能
1. 配合webpack的Tree Shaking功能，我们可以在编译时把无关代码删除
2. 可以在代码中实现DSL，编译时替换为实际的js代码。

有两种方法可以实现编译时注入
1. [DefinePlugin](https://webpack.docschina.org/plugins/define-plugin/),DefinePlugin 允许创建一个在编译时可以配置的全局变量。这可能会不同的环境变量编译出不同版本的代码。一个最简单的场景就是通过process.env.NODE_ENV控制加载的版本,babel-plugin-transform-define也可以实现相同功能。
2. babel-plugin-marco可以实现更加复杂的编译时替换功能，例如我们可以通过babel-plugin-macro扩充支持import的语法，使得其可以支持`import files * from 'dir/*'`之类的批量导入，这在很多场景下都非常有作用。

在本例子中我们通过process.env和definePlugin向项目中注入`appBuild`和`appManifest`两个变量，其默认值在`path.js`里定义
```js
// scripts/webpack/config/paths.js
const path = require('path');
const fs = require('fs');
const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = relativePath => path.resolve(appDirectory, relativePath);

module.exports = {
  appManifest: resolveApp('output/manifest.json'),
  appBuild: resolveApp('output')
}
```
#### dotenv
[12factory]https://12factor.net/zh_cn/config 提倡在环境中存储配置，我们使用dotenv来实现在环境中存储配置。这样方便我们在不同的环境下
对覆盖进行覆盖操作。根据[rails_dotenv](https://github.com/bkeepers/dotenv#what-other-env-files-can-i-use)的规范，我们会一次加载`${paths.dotenv}.${NODE_ENV}.local`,`${paths.dotenv}.${NODE_ENV}`,`${paths.dotenv}.local`,`paths.dotenv`配置文件，前者会覆盖后者的配置。如在本例子中我们可以在.env.production里覆盖设置`PORT=4000`覆盖默认端口。


