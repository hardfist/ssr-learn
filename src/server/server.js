import Koa from 'koa';
import React from 'react';
import serve from 'koa-static';
import path from 'path';
import koaNunjucks from 'koa-nunjucks-2';
import { renderToString } from 'react-dom/server';
import App from '../client/entry';
const manifest = require(process.env.appManifest);

const app = new Koa();
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    console.error('exception:', err);
    ctx.status = 500;
  }
});
app.use(serve(process.env.appBuild));
app.use(
  koaNunjucks({
    ext: 'njk',
    path: path.join(__dirname, 'views')
  })
);
app.use(async ctx => {
  const context = {};
  const markup = renderToString(<App url={ctx.url} context={context} />);
  if (context.url) {
    ctx.status = context.status;
    ctx.redirect(context.url);
    return;
  }
  await ctx.render('home', {
    markup,
    manifest
  });
});
export async function startServer() {
  app.listen(process.env.PORT || 3000, () => {
    console.log('start server at port:', process.env.PORT || 3000);
  });
}
