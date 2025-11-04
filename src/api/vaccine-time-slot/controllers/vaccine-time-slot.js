'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const adminLogHelper = require('../../../utils/adminLogHelper');

module.exports = createCoreController('api::vaccine-time-slot.vaccine-time-slot', ({ strapi }) => ({

  timeToMinutes(timeStr) {
    const [h, m, s = 0] = timeStr.split(':').map(Number);
    return h * 60 + m + s / 60;
  },

  async create(ctx) {
    const user = ctx.state.user;
    const data = ctx.request.body.data || ctx.request.body;
    const { startTime, endTime, vaccine } = data;

    if (!startTime || !endTime || !vaccine) {
      return ctx.badRequest('กรุณาระบุ startTime, endTime และ vaccine');
    }

    const newStart = this.timeToMinutes(startTime);
    const newEnd = this.timeToMinutes(endTime);

    if (newStart >= newEnd) {
      return ctx.badRequest('เวลาต้องเริ่มก่อนเวลาสิ้นสุด');
    }

    try {
      // ดึงข้อมูล vaccine เพื่อตรวจสอบ maxQuota
      const vaccineEntity = await strapi.entityService.findOne(
        'api::vaccine.vaccine',
        vaccine,
        { populate: ['vaccine_time_slots'] }
      );

      if (!vaccineEntity) {
        return ctx.badRequest('ไม่พบวัคซีนที่ระบุ');
      }

      const { maxQuota } = vaccineEntity;

      if (!maxQuota) {
        return ctx.badRequest('วัคซีนนี้ไม่ได้กำหนด maxQuota');
      }

      // ตรวจสอบการทับซ้อนของสล็อตเวลา
      const existingSlots = await strapi.entityService.findMany('api::vaccine-time-slot.vaccine-time-slot', {
        filters: { vaccine: vaccine },
      });

      for (const slot of existingSlots) {
        const existingStart = this.timeToMinutes(slot.startTime);
        const existingEnd = this.timeToMinutes(slot.endTime);
        if (newStart < existingEnd && newEnd > existingStart) {
          const timeRange = `${slot.startTime.slice(0, 5)} - ${slot.endTime.slice(0, 5)}`;
          return ctx.badRequest(`ไม่สามารถเลือกช่วงเวลานี้ได้ มีช่วงเวลา ${timeRange} อยู่แล้ว`);
        }
      }

      // ตรวจสอบจำนวนการจองในสล็อตเวลา
      const bookings = await strapi.entityService.findMany('api::vaccine-booking.vaccine-booking', {
        filters: {
          vaccine: vaccine,
          startTime: {
            $gte: startTime.slice(0, 5),
            $lte: endTime.slice(0, 5),
          },
          status: { $ne: 'cancelled' },
        },
      });

      const bookingCount = bookings.length;
      const remainingQuota = maxQuota - bookingCount;

      if (bookingCount >= maxQuota) {
        return ctx.badRequest(`สล็อตเวลา ${startTime.slice(0, 5)} - ${endTime.slice(0, 5)} เต็มแล้ว (จำกัด ${maxQuota} คน)`, {
          remainingQuota: 0,
        });
      }

      const response = await strapi.service('api::vaccine-time-slot.vaccine-time-slot').create({
        data,
        populate: ['vaccine'],
      });

      const created = response?.data || response;
      const vaccineTitle = created?.vaccine?.title || created?.vaccine?.data?.attributes?.title || 'ไม่ทราบชื่อวัคซีน';

      await adminLogHelper({
        action: 'vaccine_time_slot_created',
        type: 'create',
        message: `แอดมิน ${user?.username} สร้างช่วงเวลาวัคซีน ${vaccineTitle} (ID ${created.id})`,
        user: { id: user?.id },
        details: { after: created },
      });

      return {
        data: response,
        meta: { remainingQuota },
      };
    } catch (error) {
      strapi.log.error('❌ Create Vaccine Time Slot Error:', error);
      return ctx.badRequest(error.message || 'เกิดข้อผิดพลาดในการสร้างช่วงเวลาวัคซีน', {
        details: error.stack,
        remainingQuota: 0,
      });
    }
  },

  async update(ctx) {
    const user = ctx.state.user;
    const { id } = ctx.params;
    const body = ctx.request.body.data || ctx.request.body;
    const { startTime, endTime, vaccine } = body;

    if (!startTime || !endTime || !vaccine) {
      return ctx.badRequest('กรุณาระบุ startTime, endTime และ vaccine');
    }

    const newStart = this.timeToMinutes(startTime);
    const newEnd = this.timeToMinutes(endTime);

    if (newStart >= newEnd) {
      return ctx.badRequest('เวลาต้องเริ่มก่อนเวลาสิ้นสุด');
    }

    try {
      const existing = await strapi.entityService.findOne('api::vaccine-time-slot.vaccine-time-slot', id, {
        populate: ['vaccine'],
      });

      if (!existing) return ctx.notFound('ไม่พบข้อมูลช่วงเวลาวัคซีน');

      // ดึงข้อมูล vaccine เพื่อตรวจสอบ maxQuota
      const vaccineEntity = await strapi.entityService.findOne(
        'api::vaccine.vaccine',
        vaccine,
        { populate: ['vaccine_time_slots'] }
      );

      if (!vaccineEntity) {
        return ctx.badRequest('ไม่พบวัคซีนที่ระบุ');
      }

      const { maxQuota } = vaccineEntity;

      if (!maxQuota) {
        return ctx.badRequest('วัคซีนนี้ไม่ได้กำหนด maxQuota');
      }

      // ตรวจสอบการทับซ้อนของสล็อตเวลา
      const existingSlots = await strapi.entityService.findMany('api::vaccine-time-slot.vaccine-time-slot', {
        filters: {
          vaccine: vaccine,
          id: { $ne: id },
        },
      });

      for (const slot of existingSlots) {
        const existingStart = this.timeToMinutes(slot.startTime);
        const existingEnd = this.timeToMinutes(slot.endTime);
        if (newStart < existingEnd && newEnd > existingStart) {
          const timeRange = `${slot.startTime.slice(0, 5)} - ${slot.endTime.slice(0, 5)}`;
          return ctx.badRequest(`ไม่สามารถเลือกช่วงเวลานี้ได้ มีช่วงเวลา ${timeRange} อยู่แล้ว`);
        }
      }

      // ตรวจสอบจำนวนการจองในสล็อตเวลา
      const bookings = await strapi.entityService.findMany('api::vaccine-booking.vaccine-booking', {
        filters: {
          vaccine: vaccine,
          startTime: {
            $gte: startTime.slice(0, 5),
            $lte: endTime.slice(0, 5),
          },
          status: { $ne: 'cancelled' },
        },
      });

      const bookingCount = bookings.length;
      const remainingQuota = maxQuota - bookingCount;

      if (bookingCount >= maxQuota) {
        return ctx.badRequest(`สล็อตเวลา ${startTime.slice(0, 5)} - ${endTime.slice(0, 5)} เต็มแล้ว (จำกัด ${maxQuota} คน)`, {
          remainingQuota: 0,
        });
      }

      const updated = await strapi.entityService.update('api::vaccine-time-slot.vaccine-time-slot', id, {
        data: body,
        populate: ['vaccine'],
      });

      const vaccineTitle = updated?.vaccine?.title || updated?.vaccine?.data?.attributes?.title || 'ไม่ทราบชื่อวัคซีน';

      await adminLogHelper({
        action: 'vaccine_time_slot_updated',
        type: 'update',
        message: `แอดมิน ${user?.username} แก้ไขช่วงเวลาวัคซีน ${vaccineTitle} (ID ${id})`,
        user: { id: user?.id },
        details: {
          before: existing,
          after: updated,
        },
      });

      return {
        data: updated,
        meta: { remainingQuota },
      };
    } catch (error) {
      strapi.log.error('❌ Update Vaccine Time Slot Error:', error);
      return ctx.badRequest(error.message || 'เกิดข้อผิดพลาดในการแก้ไขช่วงเวลาวัคซีน', {
        details: error.stack,
        remainingQuota: 0,
      });
    }
  },

  async delete(ctx) {
    const user = ctx.state.user;
    const { id } = ctx.params;

    try {
      const existing = await strapi.entityService.findOne('api::vaccine-time-slot.vaccine-time-slot', id, {
        populate: ['vaccine'],
      });

      if (!existing) return ctx.notFound('ไม่พบข้อมูลช่วงเวลาวัคซีน');

      const vaccineTitle = existing?.vaccine?.title || existing?.vaccine?.data?.attributes?.title || 'ไม่ทราบชื่อวัคซีน';

      await strapi.service('api::vaccine-time-slot.vaccine-time-slot').delete(id);

      await adminLogHelper({
        action: 'vaccine_time_slot_deleted',
        type: 'delete',
        message: `แอดมิน ${user?.username} ลบช่วงเวลาวัคซีน ${vaccineTitle} (ID ${id})`,
        user: { id: user?.id },
        details: { before: existing },
      });

      return { message: 'ลบสำเร็จ' };
    } catch (error) {
      strapi.log.error('❌ Delete Vaccine Time Slot Error:', error);
      return ctx.badRequest(error.message || 'เกิดข้อผิดพลาดในการลบช่วงเวลาวัคซีน', {
        details: error.stack,
      });
    }
  },

}));
