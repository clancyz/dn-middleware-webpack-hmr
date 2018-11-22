const ExtractTextPlugin = require('extract-text-webpack-plugin');

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

  // generate loader string to be used with extract text plugin
  function generateLoaders (loader, loaderOptions) {
    const loaders = [cssLoader];
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
        use: loaders
      });
    } else {
      return ['style-loader'].concat(loaders);
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
