'use strict';

module.exports = (plugin) => {
  const originalMe = plugin.controllers.user.me;

  plugin.controllers.user.me = async (ctx) => {

    const user = ctx.state.user;


    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    // ถ้าเป็นแอดมิน ส่งข้อมูลเต็ม
    if (user.role?.type === 'admin') {
      const fullUser = await strapi.query('plugin::users-permissions.user').findOne({
        where: { id: user.id },
        populate: ['role'],
      });

      if (fullUser) {
        // ลบข้อมูล sensitive ที่ไม่ต้องการออกเอง
        delete fullUser.password;
        delete fullUser.resetPasswordToken;
        delete fullUser.confirmationToken;
        // ลบข้อมูลอื่น ๆ ที่ไม่อยากให้เห็นได้ที่นี่

        return fullUser;
      }
    }


    // ถ้าไม่ใช่แอดมิน (เช่น patient) ส่งเฉพาะข้อมูลที่จำเป็น
    return {
      id: user.id,
      username: user.username,
      role: {
        type: user.role?.type || null,
      },
    };
  };

  return plugin;
};
