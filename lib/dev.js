const fs =require('fs') ;
const openBrowser =require('react-dev-utils/openBrowser') ;
const webpack =require('webpack') ;
const assert =require('assert') ;
const WebpackDevServer =require('webpack-dev-server') ;
const chalk =require('chalk') ;
const formatWebpackMessages = require('react-dev-utils/formatWebpackMessages');
const prepareUrls =require('./prepareUrls') ;
const clearConsole =require('./clearConsole') ;
const errorOverlayMiddleware =require('./errorOverlayMiddleware') ;
const choosePort =require('./choosePort') ;
const getProxyConfig = require('./getProxyConfig');

/* eslint-disable no-undef */
const isInteractive = process.stdout.isTTY;
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 8000;
const HOST = process.env.HOST || '0.0.0.0';
const PROTOCOL = process.env.HTTPS ? 'https' : 'http';
const CERT =
  process.env.HTTPS && process.env.CERT
    ? fs.readFileSync(process.env.CERT)
    : '';
const KEY =
  process.env.HTTPS && process.env.KEY ? fs.readFileSync(process.env.KEY) : '';
const noop = () => {};

process.env.NODE_ENV = 'development';

async function dev({
  ctx, // context
  opts,
  webpackConfig,
  _beforeServerWithApp,
  beforeMiddlewares,
  afterMiddlewares,
  beforeServer,
  afterServer,
  contentBase,
  onCompileDone = noop,
  // proxy,
  port = opts.port,
  base,
  serverConfig: serverConfigFromOpts = {},
}) {
  assert(webpackConfig, 'webpackConfig must be supplied');
  choosePort(port || DEFAULT_PORT)
    .then(async port => {
      if (port === null) {
        return;
      }

      const compiler = webpack(webpackConfig);

      let isFirstCompile = true;
      const IS_CI = !!process.env.CI;
      const SILENT = !!process.env.SILENT;
      const urls = prepareUrls(PROTOCOL, HOST, port, base);

      compiler.plugin('invalid', () => {
        if (isInteractive) {
          clearConsole();
        }
        ctx.console.info('实时构建...');
      });


      compiler.plugin('done', async stats => {

        const messages = formatWebpackMessages(stats.toJson({}, true));
        const isSuccessful = !messages.errors.length && !messages.warnings.length;
        if (isSuccessful) {
          ctx.console.info('构建完成');
        }

        if (isSuccessful && isFirstCompile && !IS_CI && !SILENT) {
          ctx.console.info('开发服务已启动');
          ctx.console.info(`- Local:   ${urls.localUrlForTerminal} `);
          ctx.console.info(`- Network: ${chalk.cyan(urls.lanUrlForTerminal)}`);
        }

        // If errors exist, only show errors.
        if (messages.errors.length) {
          // make sound
          // ref: https://github.com/JannesMeyer/system-bell-webpack-plugin/blob/bb35caf/SystemBellPlugin.js#L14
          process.stdout.write('\x07');
          // Only keep the first error. Others are often indicative
          // of the same problem, but confuse the reader with noise.
          if (messages.errors.length > 1) {
            messages.errors.length = 1;
          }
          ctx.console.error('构建失败, 请检查: \n');
          ctx.console.error(messages.errors.join('\n\n'));
          return;
        }

        onCompileDone({
          isFirstCompile,
          stats,
        });

        if (isFirstCompile) {
          isFirstCompile = false;
          openBrowser(urls.localUrlForBrowser);
        }
      });

      const proxyConfig = await getProxyConfig(ctx);

      const serverConfig = {
        disableHostCheck: true,
        compress: true,
        clientLogLevel: 'info',
        hot: true,
        quiet: true,
        headers: {
          'access-control-allow-origin': '*',
        },
        publicPath: webpackConfig.output.publicPath,
        watchOptions: {
          ignored: /node_modules/,
        },
        historyApiFallback: false,
        overlay: false,
        host: HOST,
        proxy: proxyConfig,
        https: !!process.env.HTTPS,
        cert: CERT,
        key: KEY,
        contentBase: contentBase || process.env.CONTENT_BASE,
        before(app) {
          (beforeMiddlewares || []).forEach(middleware => {
            app.use(middleware);
          });
          // internal usage for proxy
          if (_beforeServerWithApp) {
            _beforeServerWithApp(app);
          }
          app.use(errorOverlayMiddleware());
        },
        after(app) {
          (afterMiddlewares || []).forEach(middleware => {
            app.use(middleware);
          });
        },
        ...serverConfigFromOpts,
        ...(webpackConfig.devServer || {}),
      };
      const server = new WebpackDevServer(compiler, serverConfig);

      ['SIGINT', 'SIGTERM'].forEach(signal => {
        process.on(signal, () => {
          server.close(() => {
            process.exit(0);
          });
        });
      });

      if (beforeServer) {
        beforeServer(server);
      }

      server.listen(port, HOST, err => {
        if (err) {
          ctx.console.log(err);
          return;
        }
        if (isInteractive) {
          clearConsole();
        }
        ctx.console.info('启动开发服务器...');
        if (afterServer) {
          afterServer(server);
        }
      });
    })
    .catch(err => {
      ctx.console.log(err);
    });
}

module.exports = dev;