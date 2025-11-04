const dayjs = require('dayjs');
require('dayjs/locale/th');
dayjs.locale('th');

module.exports = async ({ action, message, user, type, details }) => {
  const now = dayjs();
  const buddhistYear = now.year() + 543;


  await strapi.entityService.create('api::patient-log.patient-log', {
    data: {
        action,
        type,
        message: `${message}`,
        user: user?.id || null,
        timestamp: now.toISOString(),
        details: details || {},
      },
  });
};
