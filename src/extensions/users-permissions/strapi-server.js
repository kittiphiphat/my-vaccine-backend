'use strict';

const adminLogHelper = require('../../utils/adminLogHelper');

module.exports = (plugin) => {
  // Override me function
  const originalMe = plugin.controllers.user.me;
  plugin.controllers.user.me = async (ctx) => {

    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    if (user.role?.type === 'admin') {
      const fullUser = await strapi.query('plugin::users-permissions.user').findOne({
        where: { id: user.id },
        populate: ['role'],
      });

      if (fullUser) {
        delete fullUser.password;
        delete fullUser.resetPasswordToken;
        delete fullUser.confirmationToken;
        return fullUser;
      }
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: {
        type: user.role?.type || null,
      },
    };
  };


  return plugin;
};
