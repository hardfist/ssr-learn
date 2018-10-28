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
此时的实现十分简陋，仅能够实现最基础的服务端渲染React组件，[在线示例](https://codesandbox.io/s/31v6pq0zk5)。
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
```
```
