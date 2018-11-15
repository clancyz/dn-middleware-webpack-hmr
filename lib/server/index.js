const { resolve } = require('path');
const chalk = require('chalk');
const express = require('express');
const setup = require('./middlewares/frontendMiddleware');
const createProxy = require('./middlewares/proxyMiddleware');

exports.start = async function (opts, compiler, webpackConfig, ctx) {
  const app = express();

  opts.host = opts.host || 'localhost';
  opts.config = opts.config || 'server';

  ctx.server = app;

  const host = opts.host;
  const port = opts.port;

  const uri = chalk.magenta(`http://${host}:${port}`);

  setup({
    app,
    ctx,
    webpackConfig,
    compiler });

  const proxy = createProxy({ app, ctx });

  // use the gzipped bundle
  app.get('*.js', (req, res, next) => {
    req.url = req.url + '.gz'; // eslint-disable-line
    res.set('Content-Encoding', 'gzip');
    next();
  });

  app.listen(port, host, async err => {
    if (err) {
      ctx.console.error(err);
    } else {
      ctx.console.info('启动开发服务...');
      ctx.console.info(`监听服务端口: ${uri} `);
      if (opts.autoOpen !== false) {
        ctx.utils.open(`${opts.host}:${opts.port}`);
      }
      ctx.emit('server.start', this.server);
    }
  });
};