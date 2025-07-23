'use strict';

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    const token = ctx.cookies.get(config.cookieName || 'jwt');

    if (token && !ctx.request.header.authorization) {
      ctx.request.header.authorization = `Bearer ${token}`;
    }

    await next();
  };
};
