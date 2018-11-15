const path = require('path');
const express = require('express');
const compression = require('compression');

module.exports = function addProdMiddlewares (app, ctx, webpackConfig) {
  const publicPath = webpackConfig.output.publicPath || '/';
  const outputPath = webpackConfig.output.path || path.resolve(process.cwd(), 'build');  // eslint-disable-line 

  app.use(compression());
  app.use(publicPath, express.static(outputPath));

  app.get('*', (req, res) =>
    res.sendFile(path.resolve(outputPath, 'index.html'))
  );
};
