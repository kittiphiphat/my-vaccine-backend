'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const dayjs = require('dayjs');
const patientLogHelper = require('../../../utils/patientLogHelper');

module.exports = createCoreController('api::vaccine-booking.vaccine-booking', ({ strapi }) => ({
  async create(ctx) {
    const { data } = ctx.request.body;
    const user = ctx.state.user;

    if (!data) return ctx.badRequest('ข้อมูลไม่ครบถ้วน');

    const userId = user?.id;
    const { vaccine, patient, bookingDate, vaccine_time_slot, startTime, endTime } = data;

    if (!vaccine || !patient || !bookingDate || !startTime || !endTime || !userId) {
      return ctx.badRequest('กรุณาระบุข้อมูลที่จำเป็นให้ครบถ้วน');
    }

    const formattedStartTime = formatTime(startTime);
    const formattedEndTime = formatTime(endTime);

    if (!formattedStartTime || !formattedEndTime) {
      return ctx.badRequest('รูปแบบเวลาไม่ถูกต้อง กรุณาใช้รูปแบบ HH:mm');
    }

    try {
      return await retryTransaction(async ({ trx }) => {
        // Fetch vaccine with necessary fields and populate booking_settings
        const vaccineEntity = await strapi.entityService.findOne(
          'api::vaccine.vaccine',
          vaccine,
          {
            fields: ['title', 'useTimeSlots', 'maxQuota', 'serviceStartTime', 'serviceEndTime'],
            populate: ['vaccine_time_slots', 'booking_settings'],
            transaction: trx,
          }
        );

        if (!vaccineEntity) {
          strapi.log.error('ไม่พบวัคซีน:', { vaccineId: vaccine });
          throw new Error('วัคซีนไม่ถูกต้อง');
        }

        strapi.log.debug('Vaccine Entity:', JSON.stringify(vaccineEntity, null, 2));

        if (vaccineEntity.useTimeSlots === false) {
          const bookingSettings = Array.isArray(vaccineEntity.booking_settings)
            ? vaccineEntity.booking_settings.find(settings => settings.is_enabled)
            : vaccineEntity.booking_settings;

          if (!bookingSettings || !bookingSettings.slotDurationMinutes) {
            strapi.log.error('ไม่พบการตั้งค่าการจองหรือ slotDurationMinutes:', { vaccineId: vaccine });
            return ctx.badRequest('การตั้งค่าการจองหรือ slotDurationMinutes ไม่ได้กำหนดสำหรับวัคซีนนี้');
          }

          const { slotDurationMinutes, maxQuota } = {
            slotDurationMinutes: bookingSettings.slotDurationMinutes,
            maxQuota: vaccineEntity.maxQuota,
          };

          if (!Number.isInteger(slotDurationMinutes) || slotDurationMinutes <= 0) {
            strapi.log.error('slotDurationMinutes ไม่ถูกต้อง:', { vaccineId: vaccine, slotDurationMinutes });
            return ctx.badRequest('slotDurationMinutes ต้องเป็นจำนวนเต็มบวกเมื่อ useTimeSlots เป็น false');
          }

          if (!Number.isInteger(maxQuota) || maxQuota <= 0) {
            strapi.log.error('maxQuota ไม่ถูกต้อง:', { vaccineId: vaccine, maxQuota });
            return ctx.badRequest('maxQuota ต้องเป็นจำนวนเต็มบวกเมื่อ useTimeSlots เป็น false');
          }

          // Calculate time slots considering the lunch break (12:00–13:00)
          const start = dayjs(`${bookingDate} ${formattedStartTime}`, 'YYYY-MM-DD HH:mm');
          const slotStart = start.startOf('minute').subtract(start.minute() % slotDurationMinutes, 'minute');
          const slotEnd = slotStart.add(slotDurationMinutes, 'minute');

          // Validate that the slot is not within the lunch break
          const slotStartMinutes = slotStart.hour() * 60 + slotStart.minute();
          const lunchStart = 12 * 60; // 12:00
          const lunchEnd = 13 * 60; // 13:00
          if (slotStartMinutes >= lunchStart && slotStartMinutes < lunchEnd) {
            return ctx.badRequest('ไม่สามารถจองในช่วงพักกลางวัน (12:00–13:00)');
          }

          // Calculate total possible slots (excluding lunch break)
          const serviceStartTime = vaccineEntity.serviceStartTime || '08:00';
          const serviceEndTime = vaccineEntity.serviceEndTime || '17:00';
          const serviceStartMinutes = timeToMinutes(serviceStartTime);
          const serviceEndMinutes = timeToMinutes(serviceEndTime);
          const lunchBreakMinutes = lunchEnd - lunchStart;
          const totalServiceMinutes = serviceEndMinutes - serviceStartMinutes - lunchBreakMinutes;
          const totalPossibleSlots = Math.floor(totalServiceMinutes / slotDurationMinutes);
          const quotaPerSlot = Math.max(1, Math.ceil(maxQuota / (totalPossibleSlots || 1)));

          // Check bookings in the selected slot
          const bookingsInSlot = await strapi.entityService.findMany(
            'api::vaccine-booking.vaccine-booking',
            {
              filters: {
                vaccine: vaccine,
                bookingDate: { $eq: bookingDate },
                startTime: {
                  $gte: slotStart.format('HH:mm'),
                  $lt: slotEnd.format('HH:mm'),
                },
                status: { $ne: 'cancelled' },
              },
              transaction: trx,
            }
          );

          if (bookingsInSlot.length >= quotaPerSlot) {
            return ctx.badRequest(
              `สล็อตเวลา ${slotStart.format('HH:mm')} - ${slotEnd.format('HH:mm')} เต็มแล้ว (จำกัด ${quotaPerSlot} คน)`
            );
          }
        }

        // Check for duplicate booking
        const existingBooking = await strapi.entityService.findMany(
          'api::vaccine-booking.vaccine-booking',
          {
            filters: {
              vaccine: vaccine,
              patient: patient,
              bookingDate: { $eq: bookingDate },
              status: { $ne: 'cancelled' },
            },
            fields: ['id', 'startTime', 'endTime'], // Include startTime and endTime
            transaction: trx,
          }
        );

        if (existingBooking.length > 0) {
          const firstBooking = existingBooking[0]; // Use the first booking for the error message
          return ctx.badRequest(
            `ผู้ป่วยนี้มีการจองวัคซีน ${vaccineEntity.title} ในวันที่ ${bookingDate} เวลา ${firstBooking.startTime} - ${firstBooking.endTime} แล้ว`,
            { existingBookingIds: existingBooking.map(booking => booking.id) }
          );
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

        const cleanUser = cleanUserInfo(user);

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

        const message = `ผู้ใช้ชื่อ ${user.username} ทำการจองวัคซีน ${vaccineEntity.title} สำหรับวันที่ ${bookingDate}`;
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
      strapi.log.error('❌ ข้อผิดพลาดในการจอง:', error);
      ctx.status = 400;
      return ctx.send({
        error: { message: error.message || 'การจองล้มเหลว', details: error.stack },
      });
    }
  },
}));

function formatTime(time) {
  const timeRegex = /^([0-9]{2}):([0-9]{2})$/;
  const match = time.match(timeRegex);
  return match ? `${match[1]}:${match[2]}` : null;
}

function cleanUserInfo(user) {
  const { password, resetPasswordToken, confirmationToken, createdAt, updatedAt, provider, ...rest } = user;
  return rest;
}

function timeToMinutes(time) {
  if (!time) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
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
