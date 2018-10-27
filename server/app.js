const Koa = require('koa');
const app = new Koa();
app.use(async(ctx,next) => {
  ctx.body = 'hello world'
})
app.listen(3333, () => {
  console.log('listen at 3333')
});
