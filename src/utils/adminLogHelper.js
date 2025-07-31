const dayjs = require('dayjs');
require('dayjs/locale/th');
dayjs.locale('th');

module.exports = async ({ action, type, message, user, details }) => {
  const now = dayjs();
  const formattedDate = now.format('D MMM YYYY เวลา HH:mm');

  if (!user || !user.id) {
    console.warn('⚠️ ไม่พบข้อมูล user หรือ user.id ใน adminLogHelper:', user);
  }

  try {
    await strapi.entityService.create('api::admin-log.admin-log', {
      data: {
        action,
        type,
        message: `${message} (บันทึกเมื่อ ${formattedDate})`,
        user: user?.id || null,
        timestamp: now.toISOString(),
        details: details || {},
      },
    });

  } catch (error) {
    console.error('❌ adminLogHelper: เกิดข้อผิดพลาดขณะบันทึก log', error);
  }
};
