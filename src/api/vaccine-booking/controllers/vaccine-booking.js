'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const dayjs = require('dayjs');
require('dayjs/locale/th');
dayjs.locale('th');

const patientLogHelper = require('../../../utils/patientLogHelper');
const adminLogHelper = require('../../../utils/adminLogHelper');

module.exports = createCoreController('api::vaccine-booking.vaccine-booking', ({ strapi }) => ({

  async create(ctx) {
    const { data } = ctx.request.body;
    const user = ctx.state.user;

    if (!data) return ctx.badRequest('Missing data');

    const { vaccine, patient, bookingDate, vaccine_time_slot, startTime, endTime } = data;

    if (!vaccine || !patient || !bookingDate || !startTime || !endTime || !user?.id) {
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

        const bookingSettings = await strapi.entityService.findMany('api::booking-setting.booking-setting', {
          filters: { vaccine: vaccineEntity.id, is_enabled: true },
          limit: 1,
        });

        const setting = bookingSettings?.[0];
        const today = dayjs().startOf('day');
        const booking = dayjs(bookingDate).startOf('day');

        if (setting) {
          const diffDays = booking.diff(today, 'day');
          if (setting.advance_booking_days !== undefined && diffDays !== setting.advance_booking_days) {
            const bookingEnd = vaccineEntity.bookingEndDate ? dayjs(vaccineEntity.bookingEndDate).startOf('day') : null;
            if (!bookingEnd || booking.isAfter(bookingEnd)) {
              throw new Error(`เลยกำหนดวันสิ้นสุดการจองแล้ว`);
            }
          }

          if (setting.serviceStartTime && setting.serviceEndTime) {
            const bookingTime = dayjs(`${bookingDate}T${formattedStartTime}`);
            const startTimeLimit = dayjs(`${bookingDate}T${setting.serviceStartTime}`);
            const endTimeLimit = dayjs(`${bookingDate}T${setting.serviceEndTime}`);

            if (bookingTime.isBefore(startTimeLimit) || bookingTime.isAfter(endTimeLimit)) {
              throw new Error(`สามารถจองได้เฉพาะช่วงเวลา ${setting.serviceStartTime} - ${setting.serviceEndTime}`);
            }
          }
        }

        if (vaccine_time_slot) {
          const slot = await strapi.db.connection('vaccine_time_slots')
            .where('id', vaccine_time_slot)
            .forUpdate()
            .select('*')
            .transacting(trx)
            .first();

          if (!slot || !slot.is_enabled) throw new Error('ช่วงเวลานี้ไม่เปิดให้จอง');

          const slotBookingCount = await strapi.entityService.count('api::vaccine-booking.vaccine-booking', {
            filters: { vaccine_time_slot, bookingDate, status: 'confirmed' },
            transaction: trx,
          });

          if (slotBookingCount >= slot.quota) {
            throw new Error('ช่วงเวลานี้มีคนจองเต็มแล้ว');
          }
        }

        const vaccineBookingCount = await strapi.entityService.count('api::vaccine-booking.vaccine-booking', {
          filters: { vaccine, bookingDate, status: 'confirmed' },
          transaction: trx,
        });

        if (vaccineEntity.maxQuota && vaccineBookingCount >= vaccineEntity.maxQuota) {
          throw new Error('จำนวนจองสูงสุดในวันนั้นเต็มแล้ว');
        }

        const result = await strapi.entityService.create('api::vaccine-booking.vaccine-booking', {
          data: {
            bookingDate,
            startTime: formattedStartTime,
            endTime: formattedEndTime,
            status: 'confirmed',
            vaccine,
            patient,
            vaccine_time_slot,
            users_permissions_user: user.id,
            publishedAt: new Date().toISOString(),
          },
          transaction: trx,
        });

        await strapi.db.connection('vaccines')
          .where('id', vaccine)
          .forUpdate()
          .increment('booked', 1)
          .transacting(trx);

        const roleName = user.role?.name?.toLowerCase();
        const formattedDate = `${dayjs(bookingDate).format('D MMM YYYY')} เวลา ${formattedStartTime} - ${formattedEndTime} น.`;

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

        const message = `${roleName === 'admin' ? 'แอดมิน' : 'ผู้ใช้'}ชื่อ ${user.username} ${
          roleName === 'admin' ? `สร้างการจองวัคซีน "${vaccineEntity.title}" ให้ผู้ป่วย ID ${patient}` :
          `ทำการจองวัคซีน "${vaccineEntity.title}" ในวันที่ ${formattedDate}`
        }`;

        const logFn = roleName === 'admin' ? adminLogHelper : patientLogHelper;

        await logFn({
          action: 'booking_created',
          type: 'create',
          message,
          user,
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
    const { data } = ctx.request.body;

    if (!data) return ctx.badRequest('Missing data');

    try {
      const booking = await strapi.entityService.findOne('api::vaccine-booking.vaccine-booking', bookingId, {
        populate: ['vaccine', 'vaccine_time_slot', 'users_permissions_user'],
      });

      if (!booking) return ctx.notFound('Booking not found');

      if (booking.users_permissions_user?.id !== user.id) {
        return ctx.unauthorized('You do not have permission to update this booking');
      }

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

        const roleName = user.role?.name?.toLowerCase();
        const formattedDate = `${dayjs(booking.bookingDate).format('D MMM YYYY')}`;

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
          },
          after: {
            ...booking,
            status: 'cancelled',
          },
        };

        const message = `${roleName === 'admin' ? 'แอดมิน' : 'ผู้ใช้'}ชื่อ ${user.username} ยกเลิกการจองวัคซีน "${booking.vaccine?.title}" วันที่ ${formattedDate}`;

        const logFn = roleName === 'admin' ? adminLogHelper : patientLogHelper;

        await logFn({
          action: 'booking_cancelled',
          type: 'update',
          message,
          user,
          details: logDetails,
        });

        ctx.status = 200;
        return ctx.send({ message: 'ยกเลิกนัดเรียบร้อยแล้ว', data: updated });
      }

      const updated = await strapi.entityService.update('api::vaccine-booking.vaccine-booking', bookingId, { data });

      ctx.status = 200;
      return ctx.send({ message: 'อัปเดตใบนัดเรียบร้อย', data: updated });

    } catch (error) {
      strapi.log.error('❌ Update Booking Error:', error);
      ctx.status = 400;
      return ctx.send({ error: { message: error.message || 'Update failed', details: error.stack } });
    }
  },

}));

function formatTime(time) {
  const timeRegex = /^([0-9]{2}):([0-9]{2})$/;
  const match = time.match(timeRegex);
  return match ? `${match[1]}:${match[2]}` : null;
}

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
