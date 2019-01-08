const webpack = require('webpack');
const assert = require('assert');
const isPlainObject = require('is-plain-object');
const formatWebpackMessages = require('react-dev-utils/formatWebpackMessages');
const printBuildError = require('react-dev-utils/printBuildError');
const { printFileSizesAfterBuild } = require('react-dev-utils/FileSizeReporter');

// These sizes are pretty large. We'll warn for bundles exceeding them.
const WARN_AFTER_BUNDLE_GZIP_SIZE = 512 * 1024;
const WARN_AFTER_CHUNK_GZIP_SIZE = 1024 * 1024;

/* eslint-disable no-unused-vars*/
/* eslint-disable no-undef*/
function buildWebpack(ctx, opts = {}, webpackConfig) {

  function successHandler({ stats, warnings }) {
    if (warnings.length) {
      ctx.console.warn('构建过程存在警告：');
      ctx.console.warn(warnings.join('\n\n'));
    } else {
      ctx.console.info('构建完成');
    }

    ctx.console.info('gzip压缩后文件大小:\n');
    printFileSizesAfterBuild(
      stats,
      {
        root: webpackConfig.output.path,
        sizes: {},
      },
      webpackConfig.output.path,
      WARN_AFTER_BUNDLE_GZIP_SIZE,
      WARN_AFTER_CHUNK_GZIP_SIZE,
    );
  }

  function errorHandler(err) {
    ctx.console.error('构建失败，请查看：');
    printBuildError(err);
    process.exit(1);
  }

  function doneHandler(err, stats) {
    if (err) {
      return errorHandler(err);
    }
    const messages = formatWebpackMessages(stats.toJson({}, true));
    if (messages.errors.length) {
      if (messages.errors.length > 1) {
        messages.errors.length = 1;
      }
      return errorHandler(new Error(messages.errors.join('\n\n')));
    }

    return successHandler({
      stats,
      warnings: messages.warnings,
    });
  }

  const compiler = webpack(webpackConfig);

  if (this.emit) this.emit('webpack.compiler', compiler, webpack, opts);

  compiler.run(doneHandler);
}

module.exports = async function build({ ctx, opts = {}, webpackConfig}) {
  assert(webpackConfig, 'webpackConfig should be supplied.');
  assert(isPlainObject(webpackConfig), 'webpackConfig should be plain object.');
  buildWebpack(ctx, opts, webpackConfig);
};