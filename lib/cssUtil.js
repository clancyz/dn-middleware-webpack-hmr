const autoprefixer = require('autoprefixer');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const normalizeTheme = require('./normalizeTheme');


exports.cssLoaders = function (opts) {
  opts = opts || {};

  const isDev = opts.env === 'development';
  const isProd = opts.env === 'production';

  const DEFAULT_BROWSERS = [
    '>1%',
    'last 4 versions',
    'Firefox ESR',
    'not ie < 9', // React doesn't support IE8 anyway
    'iOS >= 9',
    'Android >= 4'
  ];

  const theme = normalizeTheme(opts.theme, opts);

  const lessOptions = {
    modifyVars: theme,
    javascriptEnabled: true,
    ...(opts.lessLoaderOptions || {}),
  };


  const postcssOptions = {
    // Necessary for external CSS imports to work
    // https://github.com/facebookincubator/create-react-app/issues/2677
    ident: 'postcss',
    plugins: () => [
      require('postcss-flexbugs-fixes'), // eslint-disable-line
      autoprefixer({
        browsers: opts.browserslist || DEFAULT_BROWSERS,
        flexbox: 'no-2009',
      }),
      ...(opts.extraPostCSSPlugins ? opts.extraPostCSSPlugins : []),
      ...(isDev || opts.compress === false
        ? []
        : [
          require('cssnano')({
            preset: [
              'default',
              opts.cssnano || {
                mergeRules: false,
                normalizeUrl: false,
              },
            ],
          }),
        ]),
    ],
  };


  const cssLoader = {
    loader: 'css-loader',
    options: {
      minimize: process.env.NODE_ENV === 'production', // eslint-disable-line 
      sourceMap: opts.sourceMap !== false,
      ...(opts.cssloaderOptions || {})
    }
  };

  const postcssLoader = {
    loader: 'postcss-loader',
    options: postcssOptions,
  };



  // generate loader string to be used with extract text plugin
  function generateLoaders (loader, loaderOptions) {
    const loaders = [cssLoader, postcssLoader];
    if (loader) {
      loaders.push({
        loader: loader + '-loader',
        options: Object.assign({}, loaderOptions, {
          sourceMap: opts.sourceMap !== false
        })
      });
    }

    const extractCssLoader = ExtractTextPlugin.extract({
      use: loaders,
      fallback: 'style-loader'
    });
    // Extract CSS when that option is specified
    // (which is the case during production build)
    if (opts.extract || isProd) {
      return extractCssLoader;
    } else {
      return ['css-hot-loader'].concat(extractCssLoader);
    }
  }

  return {
    css: generateLoaders(),
    postcss: generateLoaders(),
    less: generateLoaders('less', { ...lessOptions }),
    sass: generateLoaders('fast-sass', { indentedSyntax: true }),
    scss: generateLoaders('fast-sass'),
    stylus: generateLoaders('stylus'),
    styl: generateLoaders('stylus')
  };
};

// Generate loaders for standalone style files
exports.styleLoaders = function (opts) {
  const output = [];
  const loaders = exports.cssLoaders(opts);
  for (let extension in loaders) {
    const loader = loaders[extension];
    output.push({
      test: new RegExp('\\.' + extension + '$'),
      use: loader
    });
  }
  return output;
};
