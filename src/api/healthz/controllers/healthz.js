'use strict';

module.exports = {
  async index(ctx) {
    const user = ctx.state.user;
    const ip = ctx.request.ip;
    const now = new Date().toISOString();

    if (user && user.role?.name?.toLowerCase() === 'admin') {
      strapi.log.info(`[HEALTHZ] Admin "${user.username}" ตรวจสอบระบบ เวลา ${now} จาก IP ${ip}`);
    } else {
      strapi.log.warn(`[HEALTHZ] เข้าถึงโดยไม่ใช่ admin หรือไม่ได้ login IP ${ip}`);
    }

    ctx.send({
      status: 'ok',
      checkedBy: user?.username || null,
      role: user?.role?.name || null,
      ip,
      checkedAt: now,
    });
  },
};
