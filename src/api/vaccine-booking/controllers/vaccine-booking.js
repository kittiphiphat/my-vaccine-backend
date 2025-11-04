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

      // Check for any existing confirmed bookings for the same patient and vaccine
      const existingBookings = await strapi.entityService.findMany(
        'api::vaccine-booking.vaccine-booking',
        {
          filters: {
            vaccine: vaccine,
            patient: patient,
            booking_status: 'confirmed', // Only check for confirmed bookings
          },
          fields: ['id', 'bookingDate', 'startTime', 'endTime'],
          transaction: trx,
        }
      );

      if (existingBookings.length > 0) {
        const firstBooking = existingBookings[0];
        return ctx.badRequest(
          `ผู้ป่วยนี้มีการจองวัคซีน ${vaccineEntity.title} ในวันที่ ${firstBooking.bookingDate} เวลา ${firstBooking.startTime} - ${firstBooking.endTime} แล้ว กรุณายกเลิกการจองเดิมก่อน`,
          { existingBookingIds: existingBookings.map(booking => booking.id) }
        );
      }

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

        const start = dayjs(`${bookingDate} ${formattedStartTime}`, 'YYYY-MM-DD HH:mm');
        const slotStart = start.startOf('minute').subtract(start.minute() % slotDurationMinutes, 'minute');
        const slotEnd = slotStart.add(slotDurationMinutes, 'minute');

        const slotStartMinutes = slotStart.hour() * 60 + slotStart.minute();
        const lunchStart = 12 * 60;
        const lunchEnd = 13 * 60;
        if (slotStartMinutes >= lunchStart && slotStartMinutes < lunchEnd) {
          return ctx.badRequest('ไม่สามารถจองในช่วงพักกลางวัน (12:00–13:00)');
        }

        const serviceStartTime = vaccineEntity.serviceStartTime || '08:00';
        const serviceEndTime = vaccineEntity.serviceEndTime || '17:00';
        const serviceStartMinutes = timeToMinutes(serviceStartTime);
        const serviceEndMinutes = timeToMinutes(serviceEndTime);
        const lunchBreakMinutes = lunchEnd - lunchStart;
        const totalServiceMinutes = serviceEndMinutes - serviceStartMinutes - lunchBreakMinutes;
        const totalPossibleSlots = Math.floor(totalServiceMinutes / slotDurationMinutes);
        const quotaPerSlot = Math.max(1, Math.ceil(maxQuota / (totalPossibleSlots || 1)));

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
              booking_status: { $ne: 'cancelled' },
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

      const result = await strapi.entityService.create('api::vaccine-booking.vaccine-booking', {
        data: {
          bookingDate,
          startTime: formattedStartTime,
          endTime: formattedEndTime,
          booking_status: 'confirmed',
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
          booking_status: 'confirmed',
          vaccination_status: 'not_started',
        },
      };

      const message = `ผู้ใช้ชื่อ ${user.username} ทำการจองวัคซีน ${vaccineEntity.title} สำหรับวันที่ ${bookingDate}`;
      try {
        await patientLogHelper({
          action: 'booking_created',
          type: 'create',
          message,
          user: cleanUser,
          details: logDetails,
        });
      } catch (logError) {
        strapi.log.error('Failed to log patient activity:', logError);
      }

      return ctx.send({ message: 'สร้างใบนัดสำเร็จ', data: result });
    });
  } catch (error) {
    strapi.log.error('❌ ข้อผิดพลาดในการจอง:', error, { stack: error.stack });
    return ctx.badRequest({
      error: { message: error.message || 'การจองล้มเหลว', details: error.stack },
    });
  }
},

  async update(ctx) {
    const { id } = ctx.params;
    const { data } = ctx.request.body;

    strapi.log.debug('Update request:', { id, data });

    if (!data || (!data.booking_status && !data.vaccination_status)) {
      return ctx.badRequest('ต้องระบุสถานะการจองหรือสถานะการฉีดวัคซีน');
    }

    const allowedBookingStatuses = ['confirmed', 'cancelled'];
    const allowedVaccinationStatuses = ['not_started', 'vaccinated'];

    if (data.booking_status && !allowedBookingStatuses.includes(data.booking_status)) {
      return ctx.badRequest('สถานะการจองไม่ถูกต้อง');
    }

    if (data.vaccination_status && !allowedVaccinationStatuses.includes(data.vaccination_status)) {
      return ctx.badRequest('สถานะการฉีดวัคซีนไม่ถูกต้อง');
    }

    try {
      return await retryTransaction(async ({ trx }) => {
        const entity = await strapi.entityService.findOne(
          'api::vaccine-booking.vaccine-booking',
          id,
          { populate: ['vaccine', 'patient', 'users_permissions_user'], transaction: trx }
        );

        if (!entity) {
          strapi.log.error('Booking not found:', { id });
          return ctx.notFound('ไม่พบการจอง');
        }

        // Handle different entity structures (Strapi v4 vs. custom)
        const bookingStatus = entity.booking_status || entity.attributes?.booking_status || 'confirmed';
        const vaccinationStatus = entity.vaccination_status || entity.attributes?.vaccination_status || 'not_started';
        const vaccineData = entity.vaccine?.data || entity.attributes?.vaccine?.data;

        strapi.log.debug('Entity:', JSON.stringify(entity, null, 2));

        if (bookingStatus === 'cancelled' && data.vaccination_status) {
          return ctx.badRequest('ไม่สามารถอัปเดตสถานะการฉีดวัคซีนสำหรับการจองที่ถูกยกเลิก');
        }

        if (bookingStatus === 'cancelled' && data.booking_status && data.booking_status !== 'cancelled') {
          return ctx.badRequest('ไม่สามารถอัปเดตสถานะการจองจากยกเลิกเป็นสถานะอื่น');
        }

        const updatedEntity = await strapi.entityService.update(
          'api::vaccine-booking.vaccine-booking',
          id,
          { data, transaction: trx }
        );

        if (!updatedEntity) {
          strapi.log.error('Update failed, no entity returned:', { id, data });
          return ctx.internalServerError('การอัปเดตล้มเหลว: ไม่ได้รับข้อมูลที่อัปเดต');
        }

        if (bookingStatus !== data.booking_status || vaccinationStatus !== data.vaccination_status) {
          const user = ctx.state.user || { username: 'system', id: null };
          const cleanUser = cleanUserInfo(user);

          let vaccineEntity = null;
          if (vaccineData?.id) {
            vaccineEntity = await strapi.entityService.findOne(
              'api::vaccine.vaccine',
              vaccineData.id,
              { fields: ['title'], transaction: trx }
            );
          }

          const logDetails = {
            before: {
              booking_status: bookingStatus,
              vaccination_status: vaccinationStatus,
            },
            after: {
              booking_status: data.booking_status || bookingStatus,
              vaccination_status: data.vaccination_status || vaccinationStatus,
            },
            bookingId: id,
            vaccineTitle: vaccineEntity?.title || 'Unknown',
          };

          const statusMessages = {
            confirmed: 'ยืนยัน',
            cancelled: 'ยกเลิก',
            vaccinated: 'ฉีดแล้ว',
            not_started: 'ยังไม่ได้รับการฉีด',
          };

          let message = '';
          if (bookingStatus !== data.booking_status && vaccinationStatus !== data.vaccination_status) {
            message = `สถานะการจองวัคซีนถูกเปลี่ยนจาก ${statusMessages[bookingStatus]} เป็น ${statusMessages[data.booking_status]} และสถานะการฉีดวัคซีนจาก ${statusMessages[vaccinationStatus]} เป็น ${statusMessages[data.vaccination_status]} โดย ${user.username}`;
          } else if (bookingStatus !== data.booking_status) {
            message = `สถานะการจองวัคซีนถูกเปลี่ยนจาก ${statusMessages[bookingStatus]} เป็น ${statusMessages[data.booking_status]} โดย ${user.username}`;
          } else if (vaccinationStatus !== data.vaccination_status) {
            message = `สถานะการฉีดวัคซีนถูกเปลี่ยนจาก ${statusMessages[vaccinationStatus]} เป็น ${statusMessages[data.vaccination_status]} โดย ${user.username}`;
          }

          if (message) {
            try {
              await patientLogHelper({
                action: 'status_updated',
                type: 'update',
                message,
                user: cleanUser,
                details: logDetails,
              });
            } catch (logError) {
              strapi.log.error('Failed to log patient activity:', logError);
            }
          }
        }

        return ctx.send({ message: 'อัปเดตสำเร็จ', data: updatedEntity });
      });
    } catch (error) {
      strapi.log.error('❌ ข้อผิดพลาดในการอัปเดตสถานะ:', error, { stack: error.stack });
      return ctx.internalServerError({
        error: {
          message: error.message || 'การอัปเดตล้มเหลว',
          details: error.stack,
        },
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
