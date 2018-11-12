# REACT 服务端渲染最全教程

本系列将从零到一讲述如何搭建一个支持多页面+ 单页面 + Code Split + SSR + i18n + Redux 的 HackerNews。重点讲述构建复杂 SSR 系统碰到的各种问题。所有中间过程都可以在 codesandbox 上查看。
首先编写一个最基础的 SSR 渲染页面,我们服务端使用 Koa ，前端使用 React。

### 创建 React 组件

```jsx
// src/client/app.js
import React from 'react';
export default class App extends React.Component {
  render() {
    return <div>welcome to ssr world</div>;
  }
}
```

### 与服务端集成

```jsx
// src/server/server.js
import Koa from 'koa';
import React from 'react';
import { renderToString } from 'react-dom/server';
import App from '../client/app';

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
    console.log('start server at port:', process.env.PORT);
  });
}

// src/server/app.js
import { startServer } from './server';
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
const path = require('path');
const nodeExternals = require('webpack-node-externals');
const serverConfig = {
  entry: './src/server/app.js', // entry指向 server的入口
  mode: 'development',
  target: 'node', // 使用类node环境（使用node.js的require来加载chunk)
  externals: [nodeExternals()], // webpack打包不打包node_modules里的模块
  output: {
    path: path.join(__dirname, 'output'),
    filename: 'server.js',
    publicPath: '/'
  },
  module: {
    rules: [{ test: /\.(js)$/, use: 'babel-loader' }]
  }
};

module.exports = [serverConfig];
```

#### 代码编译

在服务端渲染的情况下，服务端需要导入 React 组件，因为 node 原生不支持 jsx 的语法，如果想直接使用 jsx 语法，势必需要对 react 组件代码进行编译。
对于服务端渲染，其代码可以分为两部分，react 组件代码(`src/client/app.js`)，server 相关代码(`src/server/app.js`)，根据不同的处理方式，可分为如下几种编译方式：

1. 仅对 react 组件代码使用 webpack 进行编译，server 使用原生的 js,好处是前后端完全分离。
2. 对 react 组件和 server 一起使用 babel 进行编译。好处是开发模式配置比较简单，使用 babel-node 即可，问题是需要做一些 hack。
3. 对 react 组件和 server 一起使用 webpack 进行编译。好处是尽可能复用 webpack 的配置，且使用者配置比较简单。

与前端编译不同的地方在于

1. target 为 node:使用 require 去加载 chunk
2. externals: 编译时不编译 node_modules 的模块，与前端编译不同，前端编译时需要将 node_modules 里模块打包而服务端则时在运行时加载 node_modules 里的模块，好处包括：
   - 减小编译文件内容加快编译速度。
   - 防止重复执行同一 node_module 下模块， 假如该模块存在副作用则可能会造成错误，一个常见的场景是 client 和 server 会公用一些模块例如 react-loadable，由于 node 的 require 缓存是基于路径的，如果对 client 进行了编译但没对 server 进行编译，这回导致 client 引用了 react-loadble 和 server 引用了 react-loadable,但是 client 对 react-loadable 进行了打包，导致 react-loadable 二次加载，然而 react-loadable 的加载具有副作用，导致 react-loadable 的部分功能失效。

我们同样需要进行 babel 配置，因为使用了 react， 所以需要对 babel 进行配置

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
const path = require('path');
const webpack = require('webpack');
const baseConfig = {
  context: process.cwd(),
  mode: 'production',
  output: {
    path: path.join(root, 'output'),
    filename: 'server.js',
    publicPath: '/'
  },
  module: {
    rules: [{ test: /\.(js)$/, use: 'babel-loader' }]
  }
};

module.exports = baseConfig;
```

```jsx
// scripts/webpack/config/webpack.config.server.js
module.exports = merge(baseConfig, {
  mode: 'development',
  devtool: 'source-map',
  entry: './src/server/app.js',
  target: 'node',
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
    filename: '[name].[chunkhash:8].js' // 设置hash用于缓存更新
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
- 不同的用户会下发不同的 参数，如在 AB 测情况下，server 会给不同用户下发 不同的参数，代码中根据不同的 参数，呈现不同的结果。
  变量注入可以分为运行时注入和编译时注入

#### 运行时注入

前端的运行是可以通过读取 server 端下发的 window.xxx 变量实现，比较简单，
服务端变量注入通常有两种方式配置文件 和配置环境变量。

##### 配置文件

我们可以为不同环境配置不同的 配置文件,如 eggjs 的多环境配置就是通过不同的 配置文件实现的根据 EGG_SERVER_ENV 读取不同的配置文件，其 config 如下所示,

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
const path = require('path');
const fs = require('fs');
const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = relativePath => path.resolve(appDirectory, relativePath);

module.exports = {
  appManifest: resolveApp('output/manifest.json'),
  appBuild: resolveApp('output')
};
```

#### dotenv

[12factory](https://12factor.net/zh_cn/config) 提倡在环境中存储配置，我们使用 dotenv 来实现在环境中存储配置。这样方便我们在不同的环境下
对覆盖进行覆盖操作。根据[rails_dotenv](https://github.com/bkeepers/dotenv#what-other-env-files-can-i-use)的规范，我们会一次加载`${paths.dotenv}.${NODE_ENV}.local`,`${paths.dotenv}.${NODE_ENV}`,`${paths.dotenv}.local`,`paths.dotenv`配置文件，前者会覆盖后者的配置。如在本例子中我们可以在.env.production 里覆盖设置`PORT=4000`覆盖默认端口。

#### 收敛配置

为了方便项目的扩展，我们将原来在项目中硬编码的一些常量配置进行统一处理，大部分和路径相关的配置收敛到`scripts/webpack/config/paths`目录下。

```js
const path = require('path');
const fs = require('fs');
const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = relativePath => path.resolve(appDirectory, relativePath);

module.exports = {
  appManifest: resolveApp('output/manifest.json'), // client编译manifest
  appBuild: resolveApp('output'), //client && server编译生成目录
  appSrc: resolveApp('src'), // cliet && server source dir
  appPath: resolveApp('.'), // 项目根目录
  dotenv: resolveApp('.env'), // .env文件
  appClientEntry: resolveApp('src/client/entry'), // client 的webpack入口
  appServerEntry: resolveApp('src/server/app') // server 的webpack入口
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
        use: 'babel-loader',
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
  ident: 'postcss',
  plugins: () => [
    require('postcss-flexbugs-fixes'),
    autoprefixer({
      browsers: ['>1%', 'last 4 versions', 'Firefox ESR', 'not ie < 9'],
      flexbox: 'no-2009'
    })
  ]
};
const loadCSS = ({ include, exclude }) => {
  let css_loader_config = {};
  const postcss_loader = {
    loader: 'postcss-loader',
    options: postCssOptions
  };
  if (IS_NODE) {
    // servre编译只需要能够解析css，并不需要实际的生成css文件
    css_loader_config = [
      {
        loader: 'css-loader',
        options: {
          importLoaders: 1
        }
      },
      postcss_loader
    ];
  } else if (IS_DEV) {
    // client 编译且为development下，使用style-loader以便支持热更新
    css_loader_config = [
      'style-loader',
      {
        loader: 'css-loader',
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
        loader: require.resolve('css-loader'),
        options: {
          importLoaders: 1,
          modules: false, // 不支持css module
          minimize: true // 压缩编译后生成的css文件
        }
      },
      {
        loader: require.resolve('postcss-loader'),
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
          filename: 'static/css/[name].[contenthash:8].css',
          chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
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

css module 的支持和上面类似，prod 模式下，我们还需要在 html 里引入 css，使用 manifest 即可轻松实现。

```js
ctx.body = `
   <html>
      <head>
        <title>SSR with RR</title>
        <link rel="stylesheet" href="${manifest['main.css']}"> # 添加对css的支持
      </head>

      <body>
        <div id="root">${markup}</div>
      </body>
      <script src="${manifest['main.js']}"></script>
    </html>
  `;
```

### Code Fence

有时我们需要控制代码只在客户端或者服务端执行，如果在 server 里直接使用了`window`或者`document`这种仅在浏览器可访问的对象，则会在 server 端报错，反之在 client 里直接发使用了`fs`这样的对象也会报错。

对于共享于服务器和客户端，但用于不同平台 API 的任务，建议将平台特定实现包含在通用 API 中，或者使用为你执行此操作的 library。例如，axios 是一个 HTTP 客户端，可以向服务器和客户端都暴露相同的 API。

对于仅浏览器可用的 API，通常方式是，1.在「纯客户端」的生命周期钩子函数中惰性访问它们（如`react`的`componentDidMount`)。

请注意，考虑到如果第三方 library 不是以上面的通用用法编写，则将其集成到服务器渲染的应用程序中，可能会很棘手。你可能要通过模拟(mock)一些全局变量来使其正常运行（如可以通过 jsdom 来 mock 浏览器的 dom 对象，进行 html 解析），但这只是 hack 的做法，并且可能会干扰到其他 library 的环境检测代码(很多的第三方库判断执行环境的代码很粗暴，通常只是判断`typeof document === 'undefined'`，这是如果你 mock 了`document`对象，会导致第三方库的判断代码出错)。

因此相比于运行时判断执行环境，我们更倾向于在编译时判断执行环境。我们使用一种称为[Code Fence](https://fusionjs.com/docs/getting-started/core-concepts/#code-fence)的技术来实现在编译时区分执行环境。
其实现方式很简单，通过 webpack 的[definePlugin](https://webpack.docschina.org/plugins/define-plugin/)为 client 和 server 定义两个不同的全局常量。

```js
// webpack.config.client.js
{
  ...
  plugins: [
    new webpack.DefinePlugin({
        __BROWSER__: JSON.stringify(true),
        __NODE__: JSON.stringify(false)
      })
  ]
  ...
}
// webpack.config.server.js

{
  ...
  plugins: [
    new webpack.DefinePlugin({
        __BROWSER__: JSON.stringify(false),
        __NODE__: JSON.stringify(true)
    })
  ]
  ...
}
```

本例中我们就可以使用`Code Fence`来统一 client 和 server 引入 app 的入口了。由于 client 和 server 渲染执行的逻辑不一致，
client 执行 hydrate 操作，而 server 端执行 renderToString 操作，导致两者导入 app 的入口无法保持一致。我们可以通过`Code Fence`在
同一个文件里为 client 和 server 导出不同的内容。

```js
// src/client/entry/index.js
import App from './app';
import ReactDOM from 'react-dom';
import React from 'react';

const clientRender = () => {
  return ReactDOM.hydrate(<App />, document.getElementById('root'));
};

const serverRender = props => {
  return <App {...props} />;
};

export default (__BROWSER__ ? clientRender() : serverRender);
```

### 页面模板支持

对于复杂的页面，直接写在模板字符串里不太现实，通常使用模板引擎来渲染页面，常见的模板引擎包括`pug`,`ejs`,`nunjuck`等。
我们这里使用`nunjuck`作为模板引擎。

```html
<!-- src/server/views/home.njk -->
<html>

<head>
  <title>SSR with RR</title>
  <link rel="stylesheet" href={{manifest['main.css']}}>
</head>

<body>
  <div id="root">{{markup|safe}}</div>
</body>
<script src={{manifest['main.js']}}></script>

</html>
```

```js
// src/server/server.js
import koaNunjucks from 'koa-nunjucks-2';
...
app.use(
  koaNunjucks({
    ext: 'njk',
    path: path.join(__dirname, 'views')
  })
);
```

由于 koa 里使用模板并不是直接`require` `views`里的模板，所以最后打包的文件并不包含`views`模板里的内容，因此我们需要将`views`里的内容拷贝过去。
另外 webpack 默认处理`__dirname`的行为是将其 mock 为`/`,因此服务端渲染的情况下，我们需要阻止其 mock 行为[\_\_dirname](https://webpack.js.org/configuration/node/#node-__dirname),同理也需要阻止`__console`和`__filename`的 mock 行为。

```js
// webpack.config.server.js
 merge(baseConfig(target, env), {
    node: {
      __console: false,
      __dirname: false, // 阻止其mock行为
      __filename: false
 });
```

### SPA 支持

我们使用`react-router@4`来实现 SPA，`react-router`对服务端渲染有着良好的支持。
`react-router`的核心 API 包括`Router`,`Route`,`Link`

- Router: 渲染环境相关，为 Route 组件提供 history 对象，`react-router`为不同的环境提供了不同的 Router 实现，浏览器环境下提供了`BrowserRouter`,服务器环境提供`StaticRouter`,测试环境提供`MemoryRouter`
- Route: 渲染环境无关，根据 Router 提供的 history 对象与 path 属性匹配，渲染对应组件。
- Link: 实现单页内跳转，更新 history，不刷新页面。
  因此对于服务端渲染，其差异主要在于 Router 的处理,Route 和 Link 的逻辑可以复用。

#### 创建 routes

```js
// src/client/entry/routes.js
import Detail from '../../container/home/detail';
import User from '../../container/home/user';
import Feed from '../../container/home/feed';
import NotFound from '../../components/not-found';
export default [
  {
    name: 'detail',
    path: '/news/item/:item_id',
    component: Detail
  },
  {
    name: 'user',
    path: '/news/user/:user_id',
    component: User
  },
  {
    name: 'feed',
    path: '/news/feed/:page',
    component: Feed
  },
  {
    name: '404',
    component: NotFound // 404兜底
  }
];
```

#### 更新 app.js

```js
import React from 'react';
import { Switch, Route, Link } from 'react-router-dom';
import RedirectWithStatus from '../../components/redirct-with-status';
import Routers from './routers';
import './index.scss';
export default class Home extends React.Component {
  render() {
    return (
      <div className="news-container">
        <div className="nav-container">
          <Link to={'/'}>Home</Link>
          <Link to={'/news/feed/1'}>Feed</Link>
          <Link to={'/news/item/1'}>Detail</Link>
          <Link to={'/news/user/1'}>User</Link>
          <Link to={'/notfound'}>Not Found</Link>
        </div>
        <div className="stage-container">
          <Switch>
            <RedirectWithStatus
              status={301}
              exact
              from={'/'}
              to={'/news/feed/1'}
            />
            {Routers.map(({ name, path, component }) => {
              return <Route key={name} path={path} component={component} />;
            })}
          </Switch>
        </div>
      </div>
    );
  }
}
```

#### 创建 Router

我们在服务端使用`StaticRouter`而在客户端使用`BrowserRouter`。StaticRouter 接受两个参数，根据 location 选择匹配组件进行渲染，
传入 context 信息用户服务端渲染是向服务端传递额外的信息,由于路由逻辑被客户端端接管，但有些路由相关业务仍然需要服务端处理，如服务端重定向，服务端日志、埋点统计等，因此我们通过 context 向服务端下发路由相关信息。

```js
// src/client/entry/index.js
import App from './app';
import { BrowserRouter, StaticRouter } from 'react-router-dom';
import routes from './routers';
import ReactDOM from 'react-dom';
import React from 'react';

const clientRender = () => {
  return ReactDOM.hydrate(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
    document.getElementById('root')
  );
};

const serverRender = props => {
  return (
    <StaticRouter location={props.url} context={props.context}>
      <App />
    </StaticRouter>
  );
};

export default (__BROWSER__ ? clientRender() : serverRender);
```

#### 配置 server

服务端需向 App 传入当前 url 和 context，然后根据 context 获取的信息可以执行服务端自定义的业务逻辑。
服务端对于路由请求一般有三种正常处理情况：

1. 正常返回页面
2. 重定向
3. 404
   对于正常返回页面不需要任何特殊处理，而对于重定向和 404 服务端通常可能有自己的处理逻辑（日志，埋点监控，后端重定向处理等），因此服务端需要对这两种情况有所感知，不能交由前端完全处理。

```js
app.use(async ctx => {
  const context = {};
  const markup = renderToString(<App url={ctx.url} context={context} />);
  if (context.url) {
    ctx.status = context.status;
    ctx.redirect(context.url); // 服务端重定向
    return;
  }
  if (context.status) {
    if (context.status === '404') {
      console.warn('page not found'); //服务端自定义404处理逻辑
      // ctx.redirect('/404'); 客户端已经做了404的容错，如果服务端想渲染服务端生成的的404页面，可以在此执行，否则可以直接复用客户端的404容错。
    }
  }
  await ctx.render('home', {
    markup,
    manifest
  });
});
```

服务端的`context.status`和`context.url`这些信息的下发逻辑都在组件内实现，以`RedirectWithStatus`组件为例

```js
// src/client/components/redirect-with-status
const RedirectWithStatus = ({ from, to, status, exact }) => (
  <Route
    render={({ staticContext }) => {
      // 客户端没有staticContext,所以需要判断，
      if (staticContext) {
        staticContext.status = status; // 下发信息给服务端
      }
      return <Redirect from={from} to={to} exact={exact} />;
    }}
  />
);
```

### 数据预取和状态

服务端渲染的时候，如果应用程序依赖于一些异步数据，我们需要在服务端预先获取这些数据，并将预取的数据同步到客户端，如果服务端和客户端
获取的状态不一致，就会导致注水失败。
因此我们不能将状态直接存放到视图组件内部，需要将数据存放在视图组件之外，需要单独的状态容器存放我们的状态。这样服务端渲染实际分为如下几步：

1. 服务端根据路由获取对应页面的异步数据。
2. 服务端使用异步数据初始化服务端状态容器。
3. 服务端根据服务端状态容器进行服务端渲染，生成 html。
4. 服务端将初始化的状态容器里的状态通过页面模板下发到客户端。
5. 客户端从页面模板中获取服务端下发的初始状态。
6. 客户端根据初始状态初始化客户端状态容器。
7. 视图组件根据状态容器的状态，进行注水操作。

我们的应用包含三个页面

- 列表页
- 详情页
- 用户页
  每个页面都需要根据 url 里的参数去异步的获取数据。因此我们需要使用 redux 来支持服务端渲染，
  直接使用 redux 来编写代码，代码十分冗余，我们使用`rematch` 简化 redux 的使用。

#### 创建 store

首先创建一个 models 文件夹，这里存放所有与状态相关的文件。

```js
// src/client/entry/models/index.js
import { init } from '@rematch/core';
import immerPlugin from '@rematch/immer';
import { news } from './news'; // 与dva的model概念类似。包含state, reducer, effects等。
const initPlugin = initialState => {
  return {
    config: {
      redux: {
        initialState
      }
    }
  };
};

export function createStore(initialState) {
  const store = init({
    models: { news },
    plugins: [
      immerPlugin(), // 使用immer来实现immutable
      initPlugin(initialState) // 使用initialState初始化状态容器
    ]
  });
  return store;
}
/// src/client/entry/models/news.js

// 假定我们有一个可以返回 Promise 的 通用 API（请忽略此 API 具体实现细节）
import { getItem, getTopStories, getUser } from 'shared/service/news';

export const news = {
  state: {
    detail: {
      item: {},
      comments: []
    },
    user: {},
    list: []
  },
  reducers: {
    updateUser(state, payload) {
      state.user = payload;
    },
    updateList(state, payload) {
      state.list = payload;
    },
    updateDetail(state, payload) {
      state.detail = payload;
    }
  },
  effects: dispatch => ({
    async loadUser(user_id) {
      const userInfo = await getUser(user_id);
      dispatch.news.updateUser(userInfo);
    },
    async loadList(page = 1) {
      const list = await getTopStories(page);
      dispatch.news.updateList(list);
    },
    async loadDetail(item_id) {
      const newsInfo = await getItem(item_id);
      const commentList = await Promise.all(
        newsInfo.kids.map(_id => getItem(_id))
      );
      dispatch.news.updateDetail({
        item: newsInfo,
        comments: commentList
      });
    }
  })
};
```

#### 注入 store

创建完 store 后，我们就可以在应用中使用 store 了。

```js
// src/client/entry/index.js

import { createStore } from './models';

const clientRender = () => {
  const store = createStore(window.__INITIAL_STATE__); // 将
  return ReactDOM.hydrate(
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>,
    document.getElementById('root')
  );
};

const serverRender = props => {
  return (
    <Provider store={props.store}>
      <StaticRouter location={props.url} context={props.context}>
        <App />
      </StaticRouter>
    </Provider>
  );
};
```

### 数据预取

对于服务端数据预取，问题关键是如何根据当前的 url 获取到匹配的页面组件，进而获取该页面所需的首屏数据。
因为首屏数据和页面存在一一对应的关系，因此我们可以考虑将首屏数据挂载到页面组件上。这是`next.js`等框架的做法，如下所示

```jsx
class Page extends React.Component {
  static async getInitialProps(url) {
    const result = await fetchData(url);
    return result;
  }
}
```

这个做法的缺陷是如果我们想对页面组件使用 HOC 进行封装，需要将静态方法透传到包裹组件上，这有时在一定程度上难以实现，典型的如`react-loadable`,无法将组件透传到`Loadable`组件上。

```jsx
{
    name: "detail",
    path: "/news/item/:item_id",
    component: Loadable({ // 因为是异步加载故这里难以将detail的静态方法透传到Loadable上。
      loader: () => import(/* webpackPrefetch: true */ "container/news/detail"),
      delay: 500,
      loading: Loading
    }),
    async asyncData({ dispatch }: Store, { params }: any) {
      await dispatch.news.loadDetail(params.item_id);
    }
  },
```

因此我们考虑将数据预取的逻辑存放在`routes`里,添加了数据预取后的`routes`如下所示。

```jsx
import Detail from 'containers/home/detail';
import User from 'containers/home/user';
import Feed from 'containers/home/feed';
import NotFound from 'components/not-found';
export default [
  {
    name: 'detail',
    path: '/news/item/:item_id',
    component: Detail,
    async asyncData({ dispatch }, { params }) {
      await dispatch.news.loadDetail(params.item_id);
    }
  },
  {
    name: 'user',
    path: '/news/user/:user_id',
    component: User,
    async asyncData(store, { params }) {
      await store.dispatch.news.loadUser(params.user_id);
    }
  },
  {
    name: 'feed',
    path: '/news/feed/:page',
    component: Feed,
    async asyncData(store, { params }) {
      await store.dispatch.news.loadList(params.page);
    }
  },
  {
    name: '404',
    component: NotFound
  }
];
```

#### 服务端数据预取

我们这里将实际的获取数据的逻辑封装在 redux 的 effects 里，这样方便服务端和客户端统一调用。
在`routes`里定义了数据预取逻辑后，我们接下来就可以在服务端进行数据预取操作了。
我们使用`react-router`的`matchPath`来根据当前路由匹配对应页面组件，进而做数据预取操作。代码如下：

```js
// src/server/server.js
app.use(async ctx => {
  const store = createStore();
  const context = {};
  const promises = [];
  routes.some(route => {
    const match = matchPath(ctx.url, route); // 判断当前页面是否与路由匹配
    if (match) {
      route.asyncData && promises.push(route.asyncData(store, match));
    }
  });
  await Promise.all(promises); // 等待服务端获取异步数据，并effect派发完毕
  const markup = renderToString(
    <App url={ctx.url} context={context} store={store} />
  );
  if (context.url) {
    ctx.status = context.status;
    ctx.redirect(context.url);
    return;
  }
  await ctx.render('home', {
    markup,
    initial_state: store.getState(), // 将服务端预取数据后的状态同步到客户端作为客户端的初始状态
    manifest
  });
});
```

### 客户端注水

实现了服务端预取之后，我们需要将服务端获取的状态同步到客户端，以保证客户端渲染的结果和服务端保持一致。
客户端注水共分为三步

#### 获取服务端完成数据预取后的 initial_state

在`newsController`中可以获取服务端的 initial_state

```tsx
await ctx.render('home', {
  markup,
  initial_state: store.getState() // 将服务端预取数据后的状态同步到客户端作为客户端的初始状态
});
```

#### 将 initial_state 同步到模板上

我们可以使用`renderState`将服务端获取的 initial_state 同步到模板上。

```html
<html>

<head>
  <title>SSR with RR</title>
  <link rel="stylesheet" href={{manifest['main.css']}}>
</head>

<body>
  <div id="root">{{markup|safe}}</div>
</body>
<script>window.__INITIAL_STATE__ = {{serialize(initial_state)|safe}}</script>  <!-- 同步intial_state到模板 -->
<script src={{manifest['main.js']}}></script>
</html>
```

将 intial_state 注入到模板时需要做 xss 防御，这里我们使用[serialize-javascript](https://github.com/yahoo/serialize-javascript)对注入的内容进行过滤。我们为 nunjuck 配置 serialize。

```js
// src/server/server.js
app.use(
  koaNunjucks({
    ext: 'njk',
    path: path.join(__dirname, 'views'),
    configureEnvironment: env => {
      env.addGlobal('serialize', obj => serialize(obj, { isJSON: true })); // 配置serialize便于模板里使用
    }
  })
);
```

#### 客户端根据模板上的 initial_state 初始化 store

configure 支持传入 intial_state 来初始化 store

```tsx
const clientRender = () => {
  const store = configureStore(window.__INITIAL_STATE__); // 根据window.__INITIAL_STATE__初始化store
  Loadable.preloadReady().then(() => {
    ReactDOM.hydrate(
      <Provider store={store}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>,
      document.getElementById('root')
    );
  });
};
```

### 客户端数据预取

受限于`react-router`并没有像`vue-router`提供类似`beforeRouteUpdate`的 api，我们只有在其他地方进行客户端预取操作，考虑如下的 hooks

1. `componentDidMount`: 需要区分是首次渲染还是路由跳转
2. `componentWillReceiveProps`: react-router 切换路由是会进行 mount/unmount 操作，路由组件切换时，页面组件不会触发`componentWillReceiveProps`
3. `history.listen`: 路由切换时触发

综上我们考虑在应用入口处通过 history.listen 里进行客户端数据预取操作。

```jsx
import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { withRouter, matchPath } from 'react-router';
import { connect } from 'react-redux';
import Routers from './routes';
import './index.scss';
class App extends React.Component {
  componentDidMount() {
    const { history } = this.props; // 客户端的数据预取操作
    this.unlisten = history.listen(async (location: any) => {
      for (const route of Routers) {
        const match = matchPath(location.pathname, route);
        if (match) {
          await route.asyncData({ dispatch: this.props.dispatch }, match);
        }
      }
    });
  }
  componentWillUnmount() {
    this.unlisten(); // 卸载时取消listen
  }
  render() {
    return (
      <div className="news-container">
        <Switch>
          {Routers.map(({ name, path, component: Component }) => {
            return <Route key={name} path={path} component={Component} />;
          })}
        </Switch>
      </div>
    );
  }
}
const mapDispatch = dispatch => {
  return {
    dispatch
  };
};
// 通过withRouter来获取history
export default withRouter <
  any >
  connect(
    undefined,
    mapDispatch
  )(App);
```

#### service 同构

上面我们统一了客户端和服务端获取异步数据的逻辑,实际的发送请求都是通过`service/news`提供。

```js
import { getItem, getTopStories, getUser } from 'service/news';
```

`shared/service/news`的实现如下

```js
import { serverUrl } from 'constants/url';
import http from 'shared/lib/http';
async function request(api, opts) {
  const result = await http.get(`${serverUrl}/${api}`, opts);
  return result;
}
async function getTopStories(page = 1, pageSize = 10) {
  let idList = [];
  try {
    idList = await request('topstories.json', {
      params: {
        page,
        pageSize
      }
    });
  } catch (err) {
    idList = [];
  }
  // parallel GET detail
  const newsList = await Promise.all(
    idList.slice(0, 10).map(id => {
      const url = `${serverUrl}/item/${id}.json`;
      return http.get(url);
    })
  );
  return newsList;
}

async function getItem(id) {
  return await request(`item/${id}.json`);
}

async function getUser(id) {
  return await request(`user/${id}.json`);
}

export { getTopStories, getItem, getUser };
```

客户端和服务端的差异被我们使用`lib/http`屏蔽了。处理`lib/http`同构需要考虑两个问题：

1. 上层 api 保持一致，因此我们考虑使用同时支持 node 和 browser 的请求库，这里使用 axios
2. server 和 client 的请求库应该是相互独立的，不能互相干扰，我们这里使用 axios 作为请求库，因为其每个 instance 配置是全局的，会导致互相干扰，因此我们需要创立两个 instance。

```js
// src/shared/service/lib/http
import client from './client';
import server from './server';

export default (__BROWSER__ ? client : server);
// src/shared/service/lib/http/client.js
import axios from 'axios';
const instance = axios.create();
instance.interceptors.response.use(
  response => {
    return response;
  },
  err => {
    return Promise.reject(err);
  }
);
export default instance;

// src/shared/service/lib/http/server.js
import axios from 'axios';
import * as AxiosLogger from 'axios-logger';
const instance = axios.create();
instance.interceptors.request.use(AxiosLogger.requestLogger);
instance.interceptors.response.use(
  response => {
    AxiosLogger.responseLogger(response);
    return response;
  },
  err => {
    return Promise.reject(err);
  }
);
export default instance;
```

### 代码分割 && 动态加载

至此我们已经实现了一个 SPA + SSR 的页面，但是此时仍然存在的一个问题是，每次首屏加载需要把所有页面的包一起加载，导致首屏的 js 包太大，我们期望非首屏的 js 包都可以异步加载，这样就可以大大减小首屏的 js 包大小。基于 webpack 实现代码分割比较简单，只需要使用`dynamic import`,webpack 自动的会将动态导入的模块进行拆包处理，然而在 SSR 情况下，就显得复杂很多。

#### 异步组件

React 在 16.6 发布了对`React.lazy`和`React.Suspense`的支持，其可很好的用于实现代码分割

```js
import React, { lazy, Suspense } from 'react';
const OtherComponent = lazy(() => import('./OtherComponent'));

function MyComponent() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OtherComponent />
    </Suspense>
  );
}
```

很可惜，其暂不支持服务端渲染，因此我们使用`react-loadable`来配合 webpack 实现代码分割。
首先我们将路由里的组件全部替换为 Loadable 组件.

```js
import NotFound from 'components/not-found';
import Loading from 'components/loading';
import Loadable from 'react-loadable';
export default [
  {
    name: 'detail',
    path: '/news/item/:item_id',
    component: Loadable({
      loader: () => import('../containers/home/detail'),
      loading: Loading,
      delay: 500
    }),
    async asyncData({ dispatch }, { params }) {
      await dispatch.news.loadDetail(params.item_id);
    }
  },
  {
    name: 'user',
    path: '/news/user/:user_id',
    component: Loadable({
      loader: () => import('../containers/home/user'),
      loading: Loading,
      delay: 500
    }),
    //component: routes['../containers/home/user'],
    async asyncData(store, { params }) {
      await store.dispatch.news.loadUser(params.user_id);
    }
  },
  {
    name: 'feed',
    path: '/news/feed/:page',
    component: Loadable({
      loader: () => import('../containers/home/feed'),
      loading: Loading,
      delay: 500
    }),
    async asyncData(store, { params }) {
      await store.dispatch.news.loadList(params.page);
    }
  },
  {
    name: '404',
    component: NotFound
  }
];
```

#### 编译配置

首先我们需要添加对`dynamic import`语法的支持，由于`dynamic import`暂时处于 stage 3 阶段，所有`@babe/preset-env`并未包含处理`dynamic import`的插件，我们需要自己安装`@babel/plugin-syntax-dynamic-import`进行处理，该插件并未对`dynamic import`做任何转换，对其转换的工作由`webpack`负责处理，其只负责语法的支持。对于没有 webpack 的环境可以使用`dynamic-import-node`将其转换为`require`得以支持。

```js
// src/.babelrc
module.exports = api => {
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
      '@babel/plugin-syntax-dynamic-import', // 支持dyanmic import
      'react-loadable/babel',
      'babel-plugin-macros'
    ]
  };
};
```

我们接着需要为每个 chunk 生成单独的文件，因此需要配置对应的 chunkName

```js
// scripts/webpack/config/webpack.config.client.js
...
    output: {
      filename: '[name].[chunkhash:8].js',
      chunkFilename: '[name].chunk.[chunkhash:8].js', // 配置chunkName
    }
...
```

对于服务端我们并不希望对 server 生成的 bundle 进行拆包处理，因此可以考虑禁止对 server 进行拆包。

```js
// scripts/webpack/config/webpack.config.server.js
   plugins: [
      new webpack.optimize.LimitChunkCountPlugin({
        maxChunks: 1
    })], // 禁止server的bundle进行拆包
```

### chunk 收集和加载

进行代码分割之后，我们接下来需要根据路由加载对应的 chunk。这里服务端和客户端的处理方式有很大的不同。

无论是在 server 还是 client，webpack 对 import('xxx')的处理方式比较类似。
**Input**

```js
import('xxx');
```

**Output**

```js
Promise.resolve().then(() => require('test-module'));
```

以`() => import('../containers/home/detail')`为例观察下 webpack 生成的代码。

```js
//output/server.js
return Promise.all(
  /*! import() | detail */ [
    __webpack_require__.e('vendors~detail~feed~user'),
    __webpack_require__.e('detail~feed'),
    __webpack_require__.e('detail')
  ]
).then(
  __webpack_require__.t.bind(
    null,
    /*! ../containers/home/detail */ './src/client/containers/home/detail/index.js',
    7
  )
);
```

```js
// output/main.js
return Promise.all(
  /*! import() | detail */ [
    __webpack_require__.e('vendors~detail~feed~user'),
    __webpack_require__.e('detail~feed'),
    __webpack_require__.e('detail')
  ]
).then(
  __webpack_require__.t.bind(
    null,
    /*! ../containers/home/detail */ './src/client/containers/home/detail/index.js',
    7
  )
);
```

可以看到 server 和 client 生成的代码是一样的，且实际的模块加载都是在 Promise.resolve()的回调。

#### 服务端 chunk 预加载

服务端我们并不需要按需加载，只需要在启动前把所有的异步的 chunk 全部加载好了即可。虽然在服务端我们可以同步加载所有模块，但是因为
webpack 将`import('xxx)`转换为`Promise.resolve().then(() => require('test-module'))`,这使得我们无法同步的去加载 chunk，
`react-loadable`为我们提供了`preloadAll`用于在 server 启动前加载所有的 chunk。

```js
// src/server/server.js
export async function startServer() {
  await Loadable.preloadAll(); // 确保所有dyamic module都加载完
  app.listen(process.env.PORT || 3000, () => {
    // eslint-disable-next-line no-console
    console.log('start server at port:', process.env.PORT || 3000);
  });
}
```

##### 客户端收集与加载

客户端的 chunk 加载就显得复杂的多主要分为五个步骤：

1. 将 module 与 Loadable 组件进行关联。
2. 将当前路由匹配到 module 进行关联。
3. 根据 module 匹配对应 chunk
4. 将 chunk 注入页面模板
5. 主程序启动前激活 chunk，避免出现 loading

##### Loadable 组件关联 module

为了后续在运行时能够根据路由匹配到需要加载的 module，我们需要将 module 信息和 Loadable 组件进行关联。我们既可以通过手动关联

```js
 {
    name: 'detail',
    path: '/news/item/:item_id',
    component: Loadable({
      loader: () =>
        import(/* webpackChunkName: "detail" */ '../containers/home/detail'),
      loading: Loading,
      modules: ['../containers/home/detail'], // 关联module信息
      webpack: ()=> [require.resolveWeak('../containers/home/detail')] // 这里只能使用resolveWeak,不能使用require.resolve否则会导致code split 失效
      delay: 500
    }),
    async asyncData({ dispatch }, { params }) {
      await dispatch.news.loadDetail(params.item_id);
    }
  },
```

如果对每个 Loadable 组件都手动的注入关联关系十分麻烦，为此`react-loadable`提供了 babel 插件为我们自动注入管理关系。

```js
...
plugins: [
  ...,
  'react-loadable/babel',
  ...
]
...
```

##### 当前路由关联 module

Loadable 组件关联完 module 信息后，我们就可以根据当前路由匹配到本次渲染所需的所有 bundle 信息了。`react-loadable`通过`Loadable.Capture`来收集这个依赖关系，`Loadable.Capture`会根据上面的管理 module 信息，匹配到所有 module。

```js
...
  const modules = [];
  const markup = renderToString(
    <Loadable.Capture report={moduleName => modules.push(moduleName)}>
      <App url={ctx.url} context={context} store={store} />
    </Loadable.Capture>
  );
...
```

##### 根据 module 匹配 chunk

收集完当前路由匹配的所有 module 后，根据 module 到 chunk 映射既可以获取到当前路由匹配的所有 chunk，我们使用`react-loadable`提供的 webpack 插件来获取 module 到 chunk 的映射。

```js
// scripts/webpack/config/webpack.config.client.js
const { ReactLoadablePlugin } = require('react-loadable/webpack');
....
plugins: [
  new ReactLoadablePlugin({
    filename: paths.appLoadableManifest //
  })
];
// scripts/webpack/config/paths.js
module.exports = {
  ...,
  appLoadableManifest: resolveApp('output/react-loadable.json'), // module到chunk的映射文件
}
```

这样既可生成`react-loadable.json`文件，其内容如下

```json
 "../containers/home/detail": [
    {
      "id": "./src/client/containers/home/detail/index.js",
      "name": "./src/client/containers/home/detail/index.js",
      "file": "detail.chunk.676c84f3.js",
      "publicPath": "/detail.chunk.676c84f3.js"
    },
    {
      "id": "./src/client/containers/home/detail/index.js",
      "name": "./src/client/containers/home/detail/index.js",
      "file": "detail.chunk.676c84f3.js.map",
      "publicPath": "/detail.chunk.676c84f3.js.map"
    }
  ],
```

这样通过`react-loadable`提供的`getBundles`即可获取匹配的 chunk。然后注入模板即可。和服务端类似，虽然chunk文件加载，仍然
需要手动的加载chunk里包含的module。通过`react-loadable`的`preloadAll`注册module。

```js
// src/server/server.js
app.use(async (ctx, next) => {
  ...
  const modules = [];
  const markup = renderToString(
    <Loadable.Capture report={moduleName => modules.push(moduleName)}>
      <App url={ctx.url} context={context} store={store} />
    </Loadable.Capture>
  );
  const bundles = getBundles(stats, modules); // 获取chunk信息
  const js_bundles = bundles.filter(({ file }) => file.endsWith('.js'));
  const css_bundles = bundles.filter(({ file }) => file.endsWith('.css'));
  await ctx.render('home', {
    markup,
    initial_state: store.getState(),
    manifest,
    css_bundles, // 注入css chunk
    js_bundles // 注入js chunk
  });
});
```
chunk注入模板
```html
<html>

<head>
  <title>SSR with RR</title>
  <link rel="stylesheet" href={{manifest['main.css']}}>
{% for item in css_bundles %}
<link rel="stylesheet"  href={{item.publicPath}}> 注入css chunk
{% endfor %}
</head>

<body>
  <div id="root">{{markup|safe}}</div>
</body>
{% for item in js_bundles %}
<script src={{item.publicPath}}></script> 注入js chunk
{% endfor %}
<script>window.__INITIAL_STATE__ = {{serialize(initial_state)|safe}}</script>
<script src={{manifest['main.js']}}></script>
</html>
```