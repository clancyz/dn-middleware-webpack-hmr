const webpack = require('webpack');
const generateConfig = require('./generate');
const path = require('path');
const fs = require('fs');
const utils = require('ntils');
const dev = require('./dev');
const build = require('./build');

/**
 * 这是一个标准的中间件工程模板
 * @param {object} opts cli 传递过来的参数对象 (在 pipe 中的配置)
 * @return {AsyncFunction} 中间件函数
 */
module.exports = function (opts) {
  opts.configFile = opts.configFile || './webpack.config.js';
  opts.watchOpts = opts.watchOpts || {};
  opts.watchOpts.aggregateTimeout = opts.watchOpts.aggregateTimeout || 600;
  opts.watchOpts.ignored = opts.watchOpts.ignored || /node_modules/;
  opts.inject = opts.inject || [];
  opts.babel = opts.babel || {};


  // eslint-disable-next-line
  if (process.env.DN_CMD === 'dev') {
    opts.env = 'development';
  } 
  // eslint-disable-next-line
  else if (process.env.DN_CMD === 'build') {
    opts.env = 'production';
  }

  // 外层函数的用于接收「参数对象」
  // 必须返回一个中间件处理函数
  /* eslint-disable max-statements */
  return async function (next) {
    if (this.utils.oneport) {
      opts.port = opts.port || await this.utils.oneport();
    } else {
      opts.port = opts.port || 8001;
    }
    this.webpack = webpack;

    this.console.info('开始构建...');
    if (this.emit) this.emit('webpack.opts', opts, webpack);
    let config = opts.configObject || await generateConfig(this, opts);
    // config
    let customConfigFile = path.resolve(this.cwd, opts.configFile);
    if (fs.existsSync(customConfigFile)) {
      let customConfigsGenerate = require(customConfigFile);
      if (utils.isFunction(customConfigsGenerate)) {
        await customConfigsGenerate(config, webpack, this);
        this.console.info('已合并自定义构建配置...');
      } else if (!utils.isNull(customConfigsGenerate)) {
        config = customConfigsGenerate;
        this.console.warn('已使用自定义构建配置...');
      }
    }

    // resolve
    config.resolve = config.resolve || {};
    config.resolve.symlinks = true;
    config.resolve.modules = config.resolve.modules || [];
    config.resolve.modules = config.resolve.modules.concat([
      path.resolve(this.cwd, './node_modules/'),
      path.resolve(__dirname, '../node_modules/'), // eslint-disable-line 
      this.cwd,
      path.resolve(__dirname, '../') // eslint-disable-line 
    ]);
    config.resolveLoader = config.resolve;

    // 应用 faked
    if (this.faked) this.faked.apply(config);
    if (this.emit) this.emit('webpack.config', config, webpack, opts);
    this.webpackConfig = config;

    await this.utils.sleep(1000);

    if (opts.env === 'development') {
      await dev({
        ctx: this,
        webpackConfig: config,
        opts,
      });
      return next();
    } else if (opts.env === 'production') {

      await build({
        ctx: this,
        webpackConfig: config,
        opts,
      });
    }
  };
};
