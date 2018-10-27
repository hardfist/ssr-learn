# REACT 服务端渲染最全教程

本文系列将从零到一讲述如何搭建一个单页 SSR 的 HackerNews。重点讲述构建复杂 SSR 系统碰到的各种问题。
首先编写一个最基础的 SSR 渲染页面,我们服务端使用 Koa 前端使用 React。

### 创建 React 组件

```jsx
// client/app.js
import React from "react";
export default class App extends React.Component {
  render() {
    return <div>welcome to ssr world</div>;
  }
}
```

### 与服务端集成

```jsx
// server/server.js
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

// server/app.js
import { startServer } from "./server";
startServer();
```
此时的实现十分简陋，仅能够实现最基础的服务端渲染React组件，后续我们将逐步完善功能
