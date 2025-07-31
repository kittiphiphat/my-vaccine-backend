'use strict';

const http = require('http');
const { Server } = require('socket.io');

module.exports = {
  register(/*{ strapi }*/) {
    // ฟังก์ชันนี้ใช้ตอน register plugin ถ้าไม่ใช้ก็ปล่อยว่างไว้
  },

  bootstrap({ strapi }) {
    // สร้าง HTTP server แยก สำหรับ Socket.IO
    const socketServer = http.createServer();

    // สร้าง instance ของ Socket.IO บน server นั้น พร้อมตั้งค่า CORS
    const io = new Server(socketServer, {
      cors: {
        origin: 'http://localhost:3000',
        credentials: true,
      },
    });

    // เก็บ instance io ไว้ใน strapi เพื่อใช้งานส่วนอื่นได้
    strapi.io = io;

    // เมื่อ client เชื่อมต่อ
    io.on('connection', (socket) => {
      console.log('🚀 Socket connected:', socket.id);

      // ตัวอย่าง event ฟังจาก client
      socket.on('message', (data) => {
        console.log('Received message from client:', data);
        socket.emit('reply', `Server received: ${data}`);
      });

      // เมื่อ client ตัดการเชื่อมต่อ
      socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
      });
    });

    // ให้ Socket.IO server ฟังบน port 4000
    const port = 4000;
    socketServer.listen(port, () => {
      console.log(`🚀 Socket.IO running on http://localhost:${port}`);
    });

    // ตั้ง CRON JOB - ลบ log เก่าและอัปเดตอายุผู้ป่วย
    strapi.cron.add({
      '0 0 1 * *': async () => {
        const now = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(now.getMonth() - 6);

        try {
          // ลบ patient-log ที่เก่ากว่า 6 เดือน
          await strapi.db.query('api::patient-log.patient-log').deleteMany({
            where: { timestamp: { $lt: sixMonthsAgo.toISOString() } },
          });

          // ลบ admin-log ที่เก่ากว่า 6 เดือน
          await strapi.db.query('api::admin-log.admin-log').deleteMany({
            where: { timestamp: { $lt: sixMonthsAgo.toISOString() } },
          });

          // อัปเดตอายุ patient
          const patients = await strapi.db.query('api::patient.patient').findMany({
            select: ['id', 'birthdate', 'age'],
          });

          const updatedPatients = [];

          for (const patient of patients) {
            const birthDate = new Date(patient.birthdate);
            const ageDiff = now.getFullYear() - birthDate.getFullYear();
            const hasBirthdayPassed =
              now.getMonth() > birthDate.getMonth() ||
              (now.getMonth() === birthDate.getMonth() && now.getDate() >= birthDate.getDate());

            const newAge = hasBirthdayPassed ? ageDiff : ageDiff - 1;

            if (newAge !== patient.age) {
              updatedPatients.push({ id: patient.id, age: newAge });
            }
          }

          for (const update of updatedPatients) {
            await strapi.db.query('api::patient.patient').update({
              where: { id: update.id },
              data: { age: update.age },
            });
          }

          // เพิ่ม log ระบบ
          await strapi.db.query('api::admin-log.admin-log').create({
            data: {
              message: `ระบบลบ log เก่า และอัปเดตอายุ ${updatedPatients.length} คน`,
              type: 'system',
              timestamp: new Date().toISOString(),
            },
          });

          strapi.log.info(`[CRON] ลบ log และอัปเดตอายุ ${updatedPatients.length} รายสำเร็จ`);
        } catch (error) {
          strapi.log.error('❌ CRON ERROR:', error);
        }
      },
    });
  },
};
