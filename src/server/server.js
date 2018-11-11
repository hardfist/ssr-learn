import Koa from 'koa';
import React from 'react';
import serve from 'koa-static';
import path from 'path';
import koaNunjucks from 'koa-nunjucks-2';
import { matchPath } from 'react-router-dom';
import { renderToString } from 'react-dom/server';
import serialize from 'serialize-javascript';
import { App, createStore, routes } from '../client/entry';
const manifest = require(process.env.appManifest);

const app = new Koa();
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('exception:', err);
    ctx.status = 500;
  }
});
app.use(serve(process.env.appBuild));
app.use(
  koaNunjucks({
    ext: 'njk',
    path: path.join(__dirname, 'views'),
    configureEnvironment: env => {
      env.addGlobal('serialize', obj => serialize(obj, { isJSON: true }));
    }
  })
);
app.use(async ctx => {
  const store = createStore();
  const context = {};
  const promises = [];
  routes.some(route => {
    const match = matchPath(ctx.url, route);
    if (match) {
      route.asyncData && promises.push(route.asyncData(store, match));
    }
  });
  await Promise.all(promises);
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
    initial_state: store.getState(),
    manifest
  });
});
export async function startServer() {
  app.listen(process.env.PORT || 3000, () => {
    // eslint-disable-next-line no-console
    console.log('start server at port:', process.env.PORT || 3000);
  });
}
