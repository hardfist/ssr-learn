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
  appClientDir: resolveApp('src/client'),
  appServerDir: resolveApp('src/server'),
  appSharedDir: resolveApp('src/shared'),
  appClientEntry: resolveApp('src/client/entry'), // client 的webpack入口
  appServerEntry: resolveApp('src/server/app') // server 的webpack入口
};
