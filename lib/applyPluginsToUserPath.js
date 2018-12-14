const { join } = require('path');

// 主要解决路径问题, 如babel.plugin, extraPostCSSPlugins; 这些需要在用户目录下安装
module.exports = function(ctx, options, affix) {
  if (!Array.isArray(options)) {
    ctx.console.warn(`User plugin: ${affix} must be an Array. Please Check`);
    return;
  }
  const result = options.map(opt => {
    const key = opt[0];
    const value = opt[1];
    const userPath = join(ctx.cwd, `./node_modules/${affix}-${key}`);
    const changedOpt = [];
    changedOpt.push(userPath);
    changedOpt.push(value);
    return changedOpt;
  });

  return result;
};