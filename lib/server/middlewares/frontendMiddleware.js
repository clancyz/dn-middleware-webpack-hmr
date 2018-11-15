module.exports = ({ app, ctx, webpackConfig, compiler }) => {
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    const addProdMiddlewares = require('./addProdMiddlewares');
    addProdMiddlewares(app, ctx, webpackConfig);
  } else {
    const addDevMiddlewares = require('./addDevMiddlewares');
    addDevMiddlewares(app, ctx, webpackConfig, compiler);
  }

  return app;
};
