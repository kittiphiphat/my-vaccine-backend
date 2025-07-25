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
      role: {
        type: user.role?.type || null,
      },
    };
  };

  // Override delete function
  plugin.controllers.user.delete = async (ctx) => {
     console.log('Extension users-permissions strapi-server loaded');
    const admin = ctx.state.user;
    const { id } = ctx.params;

    console.log('Delete user called by:', admin?.username);

    if (!admin) {
      return ctx.unauthorized('คุณไม่ได้รับอนุญาต');
    }

    const userToDelete = await strapi.entityService.findOne('plugin::users-permissions.user', id);

    if (!userToDelete) {
      return ctx.notFound('ไม่พบผู้ใช้');
    }

    try {
      await strapi.entityService.delete('plugin::users-permissions.user', id);

      console.log('User deleted, calling adminLogHelper');

      await adminLogHelper({
        action: 'user_deleted',
        type: 'delete',
        message: `แอดมิน ${admin.username} ลบผู้ใช้ ${userToDelete.username}`,
        user: { id: admin.id },
        details: { before: userToDelete },
      });

      console.log('Log saved successfully');

      return { message: 'ลบผู้ใช้เรียบร้อยแล้ว' };
    } catch (error) {
      console.error('❌ Error deleting user or logging:', error);
      return ctx.internalServerError('ไม่สามารถลบผู้ใช้ได้');
    }
  };

  return plugin;
};
