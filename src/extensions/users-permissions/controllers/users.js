const adminLogHelper = require('../helpers/adminLogHelper');

module.exports = {
  async me(ctx) {
    try {
      const jwt = ctx.cookies.get('jwt');
      if (!jwt) {
        ctx.status = 401;
        ctx.body = { error: 'No token provided' };
        return;
      }

      const decoded = strapi
        .plugin('users-permissions')
        .service('jwt')
        .verify(jwt);

      const user = await strapi.query('plugin::users-permissions.user').findOne({
        where: { id: decoded.id },
        populate: ['role'],
      });

      if (!user) {
        ctx.status = 404;
        ctx.body = { error: 'User not found' };
        return;
      }



      ctx.body = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role?.name || null,
      };
    } catch (err) {
      console.error('❌ Error in /me:', err);
      ctx.status = 500;
      ctx.body = { error: 'Internal server error' };
    }
  },


};
