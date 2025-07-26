const dayjs = require('dayjs');
require('dayjs/locale/th');
dayjs.locale('th');

module.exports = async ({ action, message, user ,type = 'other'}) => {
  const now = dayjs();
  const formattedDate = now.format('D MMM YYYY เวลา HH:mm');

  await strapi.entityService.create('api::patient-log.patient-log', {
    data: {
      action,
      type,
      message: `${message} (บันทึกเมื่อ ${formattedDate})`,
      user: user?.id ,
      timestamp: now.toISOString(),
      details: details || {},
    },
  });
};
