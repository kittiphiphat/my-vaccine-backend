'use strict';

const http = require('http');
const { Server } = require('socket.io');

module.exports = {
  register(/*{ strapi }*/) {},

  bootstrap({ strapi }) {
    // ✅ SOCKET.IO Setup
    const server = http.createServer(strapi.server.app);
    const io = new Server(server, {
      cors: {
        origin: 'http://localhost:3000',
        credentials: true,
      },
    });

    strapi.io = io;

    io.on('connection', (socket) => {
      console.log('✅ Socket connected:', socket.id);
    });

    const port = 4000;
    server.listen(port, () => {
      console.log(`🚀 Socket.IO running on http://localhost:${port}`);
    });

    // ✅ CRON JOB - รันทุกวันที่ 1 ของเดือนเวลา 00:00
    strapi.cron.add({
      '0 0 1 * *': async () => {
        const now = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(now.getMonth() - 6);

        try {
          // 🗑️ ลบ patient-log
          const patientLogsDeleted = await strapi.db
            .query('api::patient-log.patient-log')
            .deleteMany({
              where: {
                timestamp: { $lt: sixMonthsAgo.toISOString() },
              },
            });

          // 🗑️ ลบ admin-log
          const adminLogsDeleted = await strapi.db
            .query('api::admin-log.admin-log')
            .deleteMany({
              where: {
                timestamp: { $lt: sixMonthsAgo.toISOString() },
              },
            });

          // 👴 อัปเดตอายุ patient
          const patients = await strapi.db
            .query('api::patient.patient')
            .findMany({ select: ['id', 'birthdate', 'age'] });

          const updatedPatients = [];
          for (const patient of patients) {
            const birthDate = new Date(patient.birthdate);
            const ageDiff = now.getFullYear() - birthDate.getFullYear();
            const hasBirthdayPassed =
              now.getMonth() > birthDate.getMonth() ||
              (now.getMonth() === birthDate.getMonth() &&
                now.getDate() >= birthDate.getDate());

            const newAge = hasBirthdayPassed ? ageDiff : ageDiff - 1;

            if (newAge !== patient.age) {
              updatedPatients.push({
                id: patient.id,
                age: newAge,
              });
            }
          }

          for (const update of updatedPatients) {
            await strapi.db.query('api::patient.patient').update({
              where: { id: update.id },
              data: { age: update.age },
            });
          }

          // 🪵 เพิ่ม system log
          await strapi.db.query('api::admin-log.admin-log').create({
            data: {
              message: `ระบบลบ log เก่า และอัปเดตอายุ ${updatedPatients.length} คน`,
              type: 'system',
              timestamp: new Date().toISOString(),
            },
          });

          strapi.log.info(
            `[CRON] ลบ log สำเร็จ + อัปเดตอายุ ${updatedPatients.length} ราย`
          );
        } catch (err) {
          strapi.log.error('❌ CRON ERROR:', err);
        }
      },
    });
  },
};
