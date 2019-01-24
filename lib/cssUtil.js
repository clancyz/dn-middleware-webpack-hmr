const autoprefixer = require('autoprefixer');
const ExtractTextPlugin = require('extract-text-webpack-plugin');


exports.cssLoaders = function (opts) {
  opts = opts || {};

  const isDev = opts.env === 'development';
  const isProd = opts.env === 'production';

  const lessOptions = {
    modifyVars: opts.theme,
    javascriptEnabled: true,
    ...(opts.lessLoaderOptions || {}),
  };

  const defaultPxToViewportOptions = { 
    viewportWidth: 750, // (Number) The width of the viewport. 
    viewportHeight: 1334, // (Number) The height of the viewport. 
    unitPrecision: 5, // (Number) The decimal numbers to allow the REM units to grow to. 
    viewportUnit: 'vw', // (String) Expected units. 
    selectorBlackList: ['.ignore', '.hairlines'], // (Array) The selectors to ignore and leave as px. 
    minPixelValue: 1, // (Number) Set the minimum pixel value to replace. 
    mediaQuery: false // (Boolean) Allow px to be converted in media queries. 
  };

  const postcssMobileOptions = [
    // vw适配
    require('postcss-px-to-viewport')(
      opts.pxToViewportOptions 
        ? {...defaultPxToViewportOptions, ...opts.pxToViewportOptions}
        : defaultPxToViewportOptions),
    // 长宽比
    require('postcss-aspect-ratio-mini'),
    // 1px border
    require('postcss-write-svg')({
      utf8: false
    })
  ];

  const postcssOptions = {
    // Necessary for external CSS imports to work
    // https://github.com/facebookincubator/create-react-app/issues/2677
    ident: 'postcss',
    plugins: () => [
      require('postcss-flexbugs-fixes'), // eslint-disable-line
      autoprefixer({
        browsers: opts.browserslist,
        flexbox: 'no-2009',
      }),
      ...(opts.isMobile ? postcssMobileOptions : []),
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
                autoprefixer: false,
                'postcss-zindex': false,
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
      ...(opts.cssLoaderOptions || {})
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
