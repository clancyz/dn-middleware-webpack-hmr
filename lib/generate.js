const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const WatchMissingNodeModulesPlugin = require('react-dev-utils/WatchMissingNodeModulesPlugin');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const path = require('path');
const globby = require('globby');
const utils = require('ntils');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const confman = require('confman');
const Visualizer = require('webpack-visualizer-plugin');
const cssUtil = require('./cssUtil');

webpack.HtmlWebpackPlugin = HtmlWebpackPlugin;
webpack.ExtractTextPlugin = ExtractTextPlugin;
webpack.OptimizeCssAssetsPlugin = OptimizeCssAssetsPlugin;

// 生成排除配置
function makeExternal (commonjs, root, amd) {
  amd = amd || commonjs;
  let commonjs2 = commonjs;
  return { commonjs, commonjs2, root, amd };
}

// 库默认排除设定
const LIB_DEFAULT_EXTERNALS = {
  'jquery': makeExternal('jquery', 'jQuery'),
  'zepto': makeExternal('zepto', 'Zepto'),
  'react': makeExternal('react', 'React'),
  'react-dom': makeExternal('react-dom', 'ReactDOM')
};

// 普通项目默认排除设定
const PRO_DEFAULT_EXTERNALS = {
  'jquery': 'jQuery',
  'zepto': 'Zepto',
  'react': 'React',
  'react-dom': 'ReactDOM'
};

// 处理默认 Opts
/* eslint-disable max-statements */
async function handleOpts (ctx, opts) {

  opts = opts || {};

  if (!opts.browsersList) {
    opts.browsersList = opts.isMobile 
      ? ['last 2 versions', 'Firefox ESR', '> 1%', 'ie >= 9', 'iOS >= 8', 'Android >= 4']
      : ['last 2 versions', 'Firefox ESR', '> 1%', 'ie >= 9'];
  }

  opts.entry = opts.entry || ['./src/*.{js,jsx,ts,tsx}'];
  if (utils.isString(opts.entry)) opts.entry = [opts.entry];
  opts.template = opts.template || ['./src/assets/*.html'];
  if (utils.isString(opts.template)) opts.template = [opts.template];
  opts.output = opts.output || './build/';
  opts.chunkFilename = opts.chunkFilename || 'chunks/[name]-[chunkhash].js';
  opts.common = opts.common || {};
  opts.common.name = opts.common.name || 'common';
  opts.folders = opts.folders || {};
  opts.folders.js = opts.folders.js || 'js';
  opts.folders.css = opts.folders.css || 'css';
  opts.folders.img = opts.folders.img || 'img';
  opts.folders.font = opts.folders.font || 'font';
  opts.folders.html = opts.folders.html || '';
  opts.config = opts.config || {};
  opts.config.name = opts.config.name || '$config';
  opts.config.path = opts.config.path || './src/config';
  if (opts.external === false || (opts.watch && opts.external !== true)) {
    opts.externals = {};
  } else {
    opts.externals = opts.externals ||
      (opts.library ? LIB_DEFAULT_EXTERNALS : PRO_DEFAULT_EXTERNALS);
  }
  if (opts.env === 'development') {
    opts.inject = opts.inject || [];
    opts.inject.push(require.resolve('./webpackHotDevClient')); // todo: needs check!
  }
  if (opts.extract !== true) {
    opts.extract = false;
  }

  return opts;
}

function createBabelOptions (opts) {
  let babel = opts.babel;
  babel.presets = babel.presets || [];
  babel.presets.push([require.resolve('babel-preset-env'), {
    targets: babel.targets || {
      browsers: opts.browsersList,
      uglify: utils.isNull(babel.uglify) ? true : babel.uglify
    },
    include: babel.include || [],
    exclude: babel.exclude || [],
    loose: babel.loose !== false,
    modules: utils.isNull(babel.modules) ? 'commonjs' : babel.modules,
    useBuiltIns: utils.isNull(babel.useBuiltIns)
      ? 'usage' : babel.useBuiltIns,
    spec: babel.spec || false,
    debug: babel.debug
  }]);
  if (babel.react !== false) {
    babel.presets.push(require.resolve('babel-preset-react'));
  }
  babel.plugins = babel.plugins || [];
  if (babel.transform !== false) {
    let transform = babel.transform || {};
    babel.plugins.push([
      require.resolve('babel-plugin-transform-runtime'), {
        'helpers': utils.isNull(transform.helpers) ? true : transform.helpers, // defaults to true
        'polyfill': utils.isNull(transform.polyfill) ? true : transform.polyfill, // defaults to true
        'regenerator': utils.isNull(transform.regenerator) ? true : transform.regenerator, // defaults to true
        'moduleName': transform.moduleName || 'babel-runtime', // defaults to 'babel-runtime'
        'useBuiltIns': transform.useBuiltIns || false
      }
    ]);
  }

  if (opts.env === 'development') {
    const hotLoaderPlugin = require.resolve('react-hot-loader/babel');
    babel.plugins.push(hotLoaderPlugin);
  }

  if ((utils.isNull(babel.modules) ||
    babel.modules === 'commonjs' ||
    babel.addExports) && babel.addExports !== false) {
    babel.plugins.push(require.resolve('babel-plugin-add-module-exports'));
  }
  let babelOptions = {
    babelrc: false,
    // cacheDirectory: true,
    presets: [
      ...babel.presets,
      require.resolve('babel-preset-stage-0')
    ],
    plugins: [
      require.resolve('babel-plugin-typecheck'),
      require.resolve('babel-plugin-transform-decorators-legacy'),
      ...babel.plugins
    ]
  };
  if (babel.strict !== true) {
    babelOptions.plugins.push(
      require.resolve('babel-plugin-transform-remove-strict-mode')
    );
  }
  return babelOptions;
}

// 处理常规 loaders
async function handleLoaders (wpConfig, opts, ctx) {
  if (opts.env === 'development' && opts.eslint !== false) {
    wpConfig.module.loaders.push({
      test: /\.js$/,
      loader: 'eslint-loader',
      enforce: 'pre',
      include: Array.isArray(opts.appSrc) 
        ? opts.appSrc.map(src => path.join(ctx.cwd, src))
        : [path.join(ctx.cwd, opts.appSrc)],
      options: {
        formatter: require('eslint-friendly-formatter'),
        emitWarning: true,
        emitError: true,
        failOnError: true,
        rules: {
          'no-debugger': 0,
          'no-unused-vars': 0,
          'no-console': 0,
          'linebreak-style': 0,
        }
      }
    });
  }

  await handleTypescript(wpConfig, opts, ctx);

  wpConfig.module.loaders.push(
    {
      test: /\.(js|jsx|mjs)$/,
      loader: 'babel-loader',
      options: createBabelOptions(opts),
      include: Array.isArray(opts.appSrc) 
        ? opts.appSrc.map(src => path.join(ctx.cwd, src)) 
        : [path.join(ctx.cwd, opts.appSrc)],
    }, {
      test: /\.json$/,
      loader: 'json-loader'
    }, {
      test: /\?raw$/,
      loader: 'raw-loader'
    }, {
      test: /\.ejs$/,
      loader: 'ejs-loader'
    }, {
      test: /\.html$/,
      loader: 'raw-loader'
    }, {
      test: /\.(png|jpg|gif)\?*.*$/,
      loader: `url-loader?limit=8192&name=${opts.folders.img}/[hash].[ext]`
    }, {
      test: /\.(eot|woff|woff2|webfont|ttf|svg)\?*.*$/,
      loader: `url-loader?limit=8192&name=${opts.folders.font}/[hash].[ext]`
    }, {
      test: /\.(yql|yamlql)$/,
      loader: 'yamlql-loader',
      options: opts.yamlqlOptions || {}
    }
  );
  opts.loaders = opts.loaders || [];
  wpConfig.module.loaders.push(...opts.loaders);
  let cssLoaderOptions = {
    modules: opts.cssModules,
    camelCase: opts.cssModules // 只要启用就采用「小驼峰」
  };

  opts.cssLoaderOptions = cssLoaderOptions;
  const cssloaders = cssUtil.styleLoaders(opts);

  wpConfig.module.loaders = wpConfig.module.loaders.concat(cssloaders);
}

// 处理ts
async function handleTypescript(wpConfig, opts, ctx) {
  wpConfig.module.loaders.push(
    {
      test: /\.(tsx|ts)$/,
      loader: 'awesome-typescript-loader',
      options: {
        useBabel: true,
        babelOptions: createBabelOptions(opts),
        include: Array.isArray(opts.appSrc) 
          ? opts.appSrc.map(src => path.join(ctx.cwd, src)) 
          : [path.join(ctx.cwd, opts.appSrc)],
      }
    }
  );

  // 处理写入tsconfig.json
  const tsconfig = path.resolve(__dirname, './tsconfig.json'); // eslint-disable-line 
  await ctx.exec({
    name: 'copy',
    files: { './tsconfig.json': tsconfig },
    override: false
  });

}

// 处理插件
async function handlerPlugins (wpConfig, opts, ctx) {

  let cssExtractPlugin = new ExtractTextPlugin({
    filename: `${opts.folders.css}/[name].css`,
    allChunks: true
  });

  wpConfig.plugins.push(new CaseSensitivePathsPlugin());

  wpConfig.plugins.push(new WatchMissingNodeModulesPlugin(path.resolve(ctx.cwd, './node_modules/')));

  wpConfig.plugins.push(cssExtractPlugin);

  if (opts.env === 'development') {
    wpConfig.plugins.push(new webpack.HotModuleReplacementPlugin());
  }

  if (!opts.common.disabled) {
    wpConfig.plugins.push(new webpack.optimize.CommonsChunkPlugin({
      name: opts.common.name,
      chunks: opts.common.chunks
    }));
  }
  if (opts.stats) {
    wpConfig.plugins.push(new Visualizer({
      filename: './report/stats.html'
    }));
  }
  if (opts.optimization) {
    wpConfig.plugins.push(new webpack.optimize.ModuleConcatenationPlugin({
      optimizationBailout: true
    }));
  }

  wpConfig.plugins.push(new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify(opts.env)// production
    }
  }));

  if (!opts.watch) {
    // 如果 watch 为 false 时 compress 才有效
    // 默认压缩只有明确设置为 false 时才不压缩
    if (opts.compress !== false) {
      wpConfig.plugins.push(new webpack.optimize.UglifyJsPlugin({
        sourceMap: opts.sourceMap !== false,
        exclude: [/\.min\.js$/, /node_modules/],
        compress: { warnings: false },
        output: { comments: false }
      }));
    }
  }
}



// 获取所有模板
async function getTemplates (opts) {
  let templates;
  if (utils.isObject(opts.template) && !utils.isArray(opts.template)) {
    templates = [];
    utils.each(opts.template, (nameExpr, fileExpr) => {
      let files = globby.sync(fileExpr);
      files.forEach(file => {
        let paths = file.split('/').reverse()
          .map(item => (path.basename(item).split('.')[0]));
        let name = nameExpr.replace(/\((\d+)\)/g, (str, index) => {
          return paths[index];
        });
        templates.push({ name, file });
      });
    });
  } else {
    let files = await globby(opts.template);
    templates = files.map(file => ({
      name: path.basename(file).split('.')[0],
      file: file
    }));
  }
  return templates;
}

// 获取所有入口文件
async function getEntries (opts) {
  let entries;
  if (utils.isObject(opts.entry) && !utils.isArray(opts.entry)) {
    entries = [];
    utils.each(opts.entry, (nameExpr, fileExpr) => {
      let files = globby.sync(fileExpr);
      files.forEach(file => {
        let paths = file.split('/').reverse()
          .map(item => (path.basename(item).split('.')[0]));
        let name = nameExpr.replace(/\((\d+)\)/g, (str, index) => {
          return paths[index];
        });
        entries.push({ name, file });
      });
    });
  } else {
    let files = await globby(opts.entry);
    entries = files.map(file => ({
      name: path.basename(file).split('.')[0],
      file: file
    }));
  }
  return entries;
}

// 处理入口文件
async function handleEntry(wpConfig, opts) {
  let entries = await getEntries(opts);
  if (entries.length < 1) throw new Error('没有发现有效的构建入口文件');
  let templates = await getTemplates(opts);
  entries.forEach(entry => {
    wpConfig.entry[entry.name] = [...opts.inject, entry.file];
    let template = templates.find(item => item.name == entry.name) ||
      templates[0];
    if (!template) return;
    wpConfig.plugins.push(new HtmlWebpackPlugin({
      filename: `./${opts.folders.html}/${entry.name}.html`,
      template: template.file,
      chunks: [opts.common.name, entry.name]
    }));
  });
}

// 处理配置
async function handleConfig (wpConfig, opts, ctx) {
  let configPath = path.resolve(ctx.cwd, opts.config.path);
  let configEnv = opts.config.env || ctx.env || ctx.command;
  confman.env = configEnv;
  ctx.$config = confman.load(configPath);
  wpConfig.plugins.push(confman.webpackPlugin({
    env: opts.config.env || ctx.env || ctx.command,
    name: opts.config.name,
    path: configPath
  }));
}

// 处理 UMD
async function handleUMD (wpConfig, opts) {
  if (!opts.umd) return;
  Object.assign(wpConfig.output, opts.umd);
}

// 配置生成函数
async function generate (ctx, opts) {
  opts = await handleOpts(ctx, opts);
  
  let wpConfig = {
    context: ctx.cwd,
    entry: {},
    resolve: {
      extensions: ['.ts', '.tsx','.js', '.mjs', '.json', '.jsx', '.css', '.less']
    },
    output: {
      publicPath: opts.publicPath,
      path: path.resolve(ctx.cwd, opts.output),
      filename: `${opts.folders.js}/[name].js`,
      chunkFilename: opts.chunkFilename
    },
    devtool: opts.sourceMap !== false ? 'eval-source-map' : false,
    module: {
      loaders: []
    },
    plugins: [],
    externals: opts.externals
  };

  await handleUMD(wpConfig, opts);
  await handleLoaders(wpConfig, opts, ctx);
  await handleEntry(wpConfig, opts);
  await handlerPlugins(wpConfig, opts, ctx);
  await handleConfig(wpConfig, opts, ctx);
  return wpConfig;
}

module.exports = generate;
