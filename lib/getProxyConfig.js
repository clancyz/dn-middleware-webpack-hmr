const fs = require('fs');
const path = require('path');

module.exports = async (ctx) => {
  // 处理默认文件
  let srcFile = path.resolve(__dirname, './server.yml'); // eslint-disable-line 
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

  const logProvider = () => {
    return {
      log: ctx.console.log,
      debug: ctx.console.log,
      info: ctx.console.info,
      warn: ctx.console.warn,
      error: ctx.console.error
    };
  };

  const config = {};

  Object.keys(rules).forEach(pattern => {
    const target = rules[pattern];
    config[pattern] = {
      target,
      changeOrigin: true,
      logProvider,
      logLevel: 'info',
    };
  });

  return config;
};
