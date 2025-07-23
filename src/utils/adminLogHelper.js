const dayjs = require('dayjs');
require('dayjs/locale/th');
dayjs.locale('th');

module.exports = async ({ action, message, user }) => {
  const now = dayjs();
  const formattedDate = now.format('D MMM YYYY เวลา HH:mm');

  await strapi.entityService.create('api::admin-log.admin-log', {
    data: {
      action,
      message: `${message} (บันทึกเมื่อ ${formattedDate})`,
      user: user?.id || null,
      timestamp: now.toISOString(),
    },
  });
};
