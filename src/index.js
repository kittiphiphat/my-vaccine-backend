'use strict';

const http = require('http');
const { Server } = require('socket.io');

module.exports = {
  bootstrap({ strapi }) {
    const socketServer = http.createServer();
    const io = new Server(socketServer, {
      cors: {
        origin: ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    strapi.io = io;

    io.on('connection', (socket) => {
      console.log('🚀 Socket connected:', socket.id);

      socket.on('vaccineUpdate', async (data) => {
        console.log('Vaccine update requested:', data);
        io.emit('vaccineUpdated');
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
      });
    });

    const port = process.env.SOCKET_IO_PORT || 4000;
    socketServer.listen(port, () => {
      console.log(`🚀 Socket.IO running on http://0.0.0.0:${port}`);
    });

    strapi.cron.add({
      '0 0 1 * *': async () => {
        console.log(`Starting CRON job for log deletion at midnight on the 1st of the month (Asia/Bangkok: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' })})`);
        const now = new Date();
        const nowInBangkok = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
        const sixMonthsAgo = new Date(nowInBangkok);
        sixMonthsAgo.setMonth(nowInBangkok.getMonth() - 6);

        try {
          // Delete old patient logs
          const deletedPatientLogs = await strapi.db.query('api::patient-log.patient-log').deleteMany({
            where: { timestamp: { $lt: sixMonthsAgo.toISOString() } },
          });
          console.log(`Deleted ${deletedPatientLogs.count} patient logs`);

          // Delete old admin logs
          const deletedAdminLogs = await strapi.db.query('api::admin-log.admin-log').deleteMany({
            where: { timestamp: { $lt: sixMonthsAgo.toISOString() } },
          });
          console.log(`Deleted ${deletedAdminLogs.count} admin logs`);

          // Log deletion event
          await strapi.db.query('api::admin-log.admin-log').create({
            data: {
              message: `ระบบลบ log เก่าที่มีอายุเกิน 6 เดือน`,
              type: 'system',
              action: 'log_deleted',
              timestamp: nowInBangkok.toISOString(),
              details: {
                deleted_patient_logs: deletedPatientLogs.count,
                deleted_admin_logs: deletedAdminLogs.count,
                cutoff_date: sixMonthsAgo.toISOString(),
              },
            },
          });

          strapi.log.info(`🚀 ลบ log สำเร็จ: patient logs ${deletedPatientLogs.count}, admin logs ${deletedAdminLogs.count}`);
        } catch (error) {
          console.error('CRON ERROR:', error.message, error.stack);
          strapi.log.error(`❌ CRON ERROR: ${error.message}`, { stack: error.stack });
        }
      },
    });
  },
};
