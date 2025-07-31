'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const dayjs = require('dayjs');
const patientLogHelper = require('../../../utils/patientLogHelper'); // import helper log

module.exports = createCoreController('api::vaccine-booking.vaccine-booking', ({ strapi }) => ({

  async create(ctx) {
    const { data } = ctx.request.body;
    const user = ctx.state.user;

    if (!data) return ctx.badRequest('Missing data');

    const userId = user?.id;
    const { vaccine, patient, bookingDate, vaccine_time_slot, startTime, endTime } = data;

    if (!vaccine || !patient || !bookingDate || !startTime || !endTime || !userId) {
      return ctx.badRequest('Missing required fields');
    }

    const formattedStartTime = formatTime(startTime);
    const formattedEndTime = formatTime(endTime);

    if (!formattedStartTime || !formattedEndTime) {
      return ctx.badRequest('Invalid time format. Please use HH:mm format');
    }

    try {
      return await retryTransaction(async ({ trx }) => {
        const vaccineEntity = await strapi.entityService.findOne(
          'api::vaccine.vaccine',
          vaccine,
          {
            populate: ['vaccine_time_slots'],
            transaction: trx,
          }
        );

        if (!vaccineEntity) throw new Error('Invalid vaccine');

        // (ตรวจสอบ booking settings, โควต้า ตามที่คุณมีอยู่เดิม)

        const result = await strapi.entityService.create('api::vaccine-booking.vaccine-booking', {
          data: {
            bookingDate,
            startTime: formattedStartTime,
            endTime: formattedEndTime,
            status: 'confirmed',
            vaccine,
            patient,
            vaccine_time_slot,
            users_permissions_user: userId,
            publishedAt: new Date().toISOString(),
          },
          transaction: trx,
        });

        await strapi.db.connection('vaccines')
          .where('id', vaccine)
          .forUpdate()
          .increment('booked', 1)
          .transacting(trx);

        // เตรียม cleanUser สำหรับ log
        const cleanUser = { ...user };
        delete cleanUser.password;
        delete cleanUser.resetPasswordToken;
        delete cleanUser.confirmationToken;
        delete cleanUser.createdAt;
        delete cleanUser.updatedAt;
        delete cleanUser.provider;



        const logDetails = {
          before: null,
          after: {
            bookingId: result.id,
            vaccineId: vaccineEntity.id,
            patientId: patient,
            bookingDate,
            startTime: formattedStartTime,
            endTime: formattedEndTime,
            vaccineTitle: vaccineEntity.title,
          },
        };

        const message = `ผู้ใช้ชื่อ ${user.username} ทำการจองวัคซีน "${vaccineEntity.title}"`;

        await patientLogHelper({
          action: 'booking_created',
          type: 'create',
          message,
          user: cleanUser,
          details: logDetails,
        });

        ctx.status = 200;
        return ctx.send({ message: 'สร้างใบนัดสำเร็จ', data: result });
      });
    } catch (error) {
      strapi.log.error('❌ Booking Error:', error);
      ctx.status = 400;
      return ctx.send({
        error: { message: error.message || 'Booking failed', details: error.stack },
      });
    }
  },

  async update(ctx) {
    const bookingId = ctx.params.id;
    const user = ctx.state.user;
    const userId = user?.id;
    const { data } = ctx.request.body;

    if (!data) return ctx.badRequest('Missing data');

    try {
      const booking = await strapi.entityService.findOne('api::vaccine-booking.vaccine-booking', bookingId, {
        populate: ['vaccine', 'vaccine_time_slot', 'users_permissions_user'],
      });

      if (!booking) return ctx.notFound('Booking not found');

      if (booking.users_permissions_user?.id !== userId) {
        return ctx.unauthorized('You do not have permission to update this booking');
      }

      // เตรียม cleanUser สำหรับ log
      const cleanUser = { ...user };
      delete cleanUser.password;
      delete cleanUser.resetPasswordToken;
      delete cleanUser.confirmationToken;
      delete cleanUser.createdAt;
      delete cleanUser.updatedAt;
      delete cleanUser.provider;

      if (data.status === 'cancelled') {
        if (booking.status !== 'confirmed') {
          return ctx.badRequest('สามารถยกเลิกได้เฉพาะใบนัดที่ถูกยืนยัน');
        }

        const updated = await strapi.entityService.update('api::vaccine-booking.vaccine-booking', bookingId, {
          data: { status: 'cancelled' },
        });

        if (booking.vaccine?.id) {
          await strapi.db.connection('vaccines')
            .where('id', booking.vaccine.id)
            .andWhere('booked', '>', 0)
            .forUpdate()
            .decrement('booked', 1);
        }

        const formattedDate = `${dayjs(booking.bookingDate).format('D MMM YYYY')}`;

        // สร้าง logDetails โดย after.user ใช้ cleanUser เดียวกับ before.user
        const logDetails = {
          before: {
            bookingId: booking.id,
            vaccineId: booking.vaccine?.id,
            patientId: booking.patient,
            bookingDate: booking.bookingDate,
            startTime: booking.startTime,
            endTime: booking.endTime,
            status: booking.status,
            vaccineTitle: booking.vaccine?.title,
            user: cleanUser,
          },
          after: {
            bookingDate: updated.bookingDate,
            bookingId: booking.id,
            vaccineId: booking.vaccine?.id,
            status: updated.status,
            patientId: booking.patient,
            startTime: updated.startTime,
            endTime: updated.endTime,
            vaccineTitle: booking.vaccine?.title,
            user: cleanUser,
          },
        };

        const message = `ผู้ใช้ชื่อ ${user.username} ยกเลิกการจองวัคซีน "${booking.vaccine?.title}" วันที่ ${formattedDate}`;

        await patientLogHelper({
          action: 'booking_cancelled',
          type: 'update',
          message,
          user: cleanUser,
          details: logDetails,
        });

        ctx.status = 200;
        return ctx.send({ message: 'ยกเลิกนัดเรียบร้อยแล้ว', data: updated });
      }

      const updated = await strapi.entityService.update('api::vaccine-booking.vaccine-booking', bookingId, {
        data,
      });

      ctx.status = 200;
      return ctx.send({ message: 'อัปเดตใบนัดเรียบร้อย', data: updated });

    } catch (error) {
      strapi.log.error('❌ Update Booking Error:', error);
      ctx.status = 400;
      return ctx.send({ error: { message: error.message || 'Update failed', details: error.stack } });
    }
  },

}));

// แปลงเวลาให้อยู่ในรูป HH:mm
function formatTime(time) {
  const timeRegex = /^([0-9]{2}):([0-9]{2})$/;
  const match = time.match(timeRegex);
  return match ? `${match[1]}:${match[2]}` : null;
}

// Retry Transaction รองรับ deadlock และ lock wait timeout พร้อม delay
async function retryTransaction(fn, retries = 5) {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      return await strapi.db.transaction(fn);
    } catch (error) {
      if (error.code === 'ER_LOCK_DEADLOCK' || error.code === 'ER_LOCK_WAIT_TIMEOUT') {
        lastError = error;
        await new Promise(res => setTimeout(res, 100 * (i + 1)));
        continue;
      } else {
        throw error;
      }
    }
  }
  throw lastError;
}
