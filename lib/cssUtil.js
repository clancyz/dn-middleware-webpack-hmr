const ExtractTextPlugin = require('extract-text-webpack-plugin');
const postcssConfig = require('./postcssConfig');

exports.cssLoaders = function (opts) {
  opts = opts || {};

  const cssLoader = {
    loader: 'css-loader',
    options: {
      minimize: process.env.NODE_ENV === 'production', // eslint-disable-line 
      sourceMap: opts.sourceMap !== false,
      ...opts.cssloaderOptions
    }
  };

  const postcssLoader = {
    loader: 'postcss-loader',
    options: { 
      sourceMap: opts.sourceMap !== false,
      ...postcssConfig,
      ...opts.postcssloaderOptions
    },
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
    // Extract CSS when that option is specified
    // (which is the case during production build)
    if (opts.extract) {
      return ExtractTextPlugin.extract({
        use: loaders,
        fallback: 'style-loader'
      });
    } else {
      return [{
        loader: 'style-loader',
        options: {
          singleton: true,
          sourceMap: opts.sourceMap !== false
        }
      }].concat(loaders);
    }
  }

  return {
    css: generateLoaders(),
    postcss: generateLoaders(),
    less: generateLoaders('less', { javascriptEnabled: true }),
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
