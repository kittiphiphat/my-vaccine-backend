const dayjs = require('dayjs');

module.exports = {
  '0 0 0 * * *': async () => {
    // ทุกวันเวลา 00:00 น.
    const users = await strapi.query('user', 'users-permissions').find();

    users.forEach(async (user) => {
      const birthDate = user.birth_date;
      if (birthDate) {
        const today = dayjs();
        const age = today.diff(dayjs(birthDate), 'year');

        // อัพเดตอายุในฐานข้อมูล
        await strapi.query('user', 'users-permissions').update({ id: user.id }, { age });
      }
    });

    console.log('Cron job for updating user age has run successfully!');
  },
};
