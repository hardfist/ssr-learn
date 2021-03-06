const path = require('path');
const fs = require('fs');
const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = relativePath => path.resolve(appDirectory, relativePath);

module.exports = {
  appLoadableManifest: resolveApp('output/react-loadable.json'), // module到chunk的映射文件
  appManifest: resolveApp('output/manifest.json'), // client编译manifest
  appBuild: resolveApp('output'), //client && server编译生成目录
  appSrc: resolveApp('src'), // cliet && server source dir
  appPath: resolveApp('.'), // 项目根目录
  dotenv: resolveApp('.env'), // .env文件
  appClientDir: resolveApp('src/client'), // client目录
  appServerDir: resolveApp('src/server'), // server目录
  appSharedDir: resolveApp('src/shared'), // shared目录
  appClientEntry: resolveApp('src/client/entry'), // client 的webpack入口
  appServerEntry: resolveApp('src/server/app') // server 的webpack入口
};
