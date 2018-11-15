const fs = require('fs');
const path = require('path');
const proxy = require('http-proxy-middleware');

module.exports = async ({ app, ctx }) => {
  // 处理默认文件
  let srcFile = path.resolve(__dirname, '../server.yml');
  let dstFile = path.resolve(ctx.cwd, './server.yml');
  if (!fs.existsSync(dstFile)) {
    let buffer = await ctx.utils.readFile(srcFile);
    await ctx.utils.writeFile(dstFile, buffer);
  }

  // 读取配置
  const configs = ctx.utils.config.load(dstFile);
  if (!configs.proxy || !configs.proxy.rules) {
    return;
  }
  const rules = configs.proxy.rules;

  const logProvider = (provider) => {
    return {
      log: ctx.console.log,
      debug: ctx.console.log,
      info: ctx.console.info,
      warn: ctx.console.warn,
      error: ctx.console.error
    };
  };

  Object.keys(rules).forEach(pattern => {
    const target = rules[pattern];
    app.use(pattern, proxy({
      target,
      changeOrigin: true,
      logProvider
    }));
  });

  return app;
};
