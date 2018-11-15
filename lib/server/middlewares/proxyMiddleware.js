const fs = require('fs');
const path = require('path');
const proxy = require('http-proxy-middleware');

module.exports = async ({ app, ctx }) => {
  // 处理默认文件
  let srcFile = path.resolve(__dirname, '../server.yml');
  debugger; // eslint-disable-line 
  let dstFile = path.resolve(ctx.cwd, './server.yml');
  if (!fs.existsSync(dstFile)) {
    let buffer = await ctx.utils.readFile(srcFile);
    await ctx.utils.writeFile(dstFile, buffer);
  }

  // 读取配置
  const configs = ctx.utils.config.load(dstFile);
  debugger;
};
