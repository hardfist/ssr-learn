import Koa from 'koa';
import React from 'react';
import serve from 'koa-static';
import { renderToString } from 'react-dom/server';
import App from '../client/entry';
const manifest = require(process.env.appManifest);

const app = new Koa();
app.use(serve(process.env.appBuild));
app.use(async ctx => {
  const markup = renderToString(<App />);
  ctx.body = `
   <html>
      <head>
        <title>SSR with RR</title>
        <link rel="stylesheet" href="${manifest['main.css']}">
      </head>

      <body>
        <div id="root">${markup}</div>
      </body>
      <script src="${manifest['main.js']}"></script>
    </html>
  `;
});
export async function startServer() {
  app.listen(process.env.PORT || 3000, () => {
    console.log('start server at port:', process.env.PORT || 3000);
  });
}
