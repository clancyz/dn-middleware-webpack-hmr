const path = require('path');
const chalk = require('chalk');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');

function createWebpackMiddleware (compiler, publicPath) {
  return webpackDevMiddleware(compiler, {
    logLevel: 'warn',
    publicPath,
    silent: true,
    stats: 'errors-only'
  });
}

module.exports = function addDevMiddlewares (app, ctx, webpackConfig, compiler) {
  const devMiddleware = createWebpackMiddleware(
    compiler,
    webpackConfig.output.publicPath || '/'
  );

  const DevMiddlewareLog = (txt) => {
    return ctx.console.log(chalk.grey(txt));
  };

  const hotMiddleware = webpackHotMiddleware(compiler, {
    log: DevMiddlewareLog
  });

  app.use(devMiddleware);

  app.use(hotMiddleware);

  compiler.plugin('compilation', function (compilation) {
    compilation.plugin('html-webpack-plugin-after-emit', function (data, cb) {
      hotMiddleware.publish({ action: 'reload' });
      cb();
    });
  });

  // Since webpackDevMiddleware uses memory-fs internally to store build
  // artifacts, we use it instead
  const fs = devMiddleware.fileSystem;

  app.get('*', (req, res) => {
    fs.readFile(path.join(compiler.outputPath, 'index.html'), (err, file) => {
      if (err) {
        res.sendStatus(404);
      } else {
        res.send(file.toString());
      }
    });
  });
};
