'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const adminLogHelper = require('../../../utils/adminLogHelper');

module.exports = createCoreController('api::vaccine-time-slot.vaccine-time-slot', ({ strapi }) => ({

  // ฟังก์ชันแปลงเวลาเป็นนาที สำหรับเปรียบเทียบ
  timeToMinutes(timeStr) {
    const [h, m, s] = timeStr.split(':').map(Number);
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

    // ดึงเวลาทั้งหมดของวัคซีนนี้
    const existingSlots = await strapi.entityService.findMany('api::vaccine-time-slot.vaccine-time-slot', {
      filters: { vaccine: vaccine },
    });

    // ตรวจสอบช่วงเวลาทับซ้อน
   for (const slot of existingSlots) {
  const existingStart = this.timeToMinutes(slot.startTime);
  const existingEnd = this.timeToMinutes(slot.endTime);
  if (newStart < existingEnd && newEnd > existingStart) {
    const timeRange = `${slot.startTime.slice(0, 5)} - ${slot.endTime.slice(0, 5)}`;
    const message = `ไม่สามารถเลือกช่วงเวลานี้ได้\nมีช่วงเวลา ${timeRange} อยู่แล้ว`;
    ctx.throw(400, message);  // ✅ ใช้ throw เพื่อไม่ให้มัน wrap object
  }
}

    // สร้างข้อมูลใหม่
    const response = await strapi.service('api::vaccine-time-slot.vaccine-time-slot').create({
      data,
      populate: ['vaccine'],
    });

    const created = response?.data || response;
    const vaccineTitle = created?.vaccine?.title || created?.vaccine?.data?.attributes?.title || 'ไม่ทราบชื่อวัคซีน';

    await adminLogHelper({
      action: 'vaccine_time_slot_created',
      type: 'create',
      message: `แอดมิน ${user?.username} สร้างช่วงเวลาวัคซีน "${vaccineTitle}" (ID ${created.id})`,
      user: { id: user?.id },
      details: { after: created },
    });

    return response;
  },

  async update(ctx) {
    const user = ctx.state.user;
    const { id } = ctx.params;
    const body = ctx.request.body.data || ctx.request.body;

    const existing = await strapi.entityService.findOne('api::vaccine-time-slot.vaccine-time-slot', id, {
      populate: ['vaccine'],
    });

    if (!existing) return ctx.notFound('ไม่พบข้อมูลช่วงเวลาวัคซีน');

    const { startTime, endTime, vaccine } = body;

    if (!startTime || !endTime || !vaccine) {
      return ctx.badRequest('กรุณาระบุ startTime, endTime และ vaccine');
    }

    const newStart = this.timeToMinutes(startTime);
    const newEnd = this.timeToMinutes(endTime);

    if (newStart >= newEnd) {
      return ctx.badRequest('เวลาต้องเริ่มก่อนเวลาสิ้นสุด');
    }

    // ดึงเวลาทั้งหมดของวัคซีนนี้ ยกเว้นตัวเอง
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
        const message = `ไม่สามารถเลือกช่วงเวลานี้ได้\nมีช่วงเวลา ${timeRange} อยู่แล้ว`;
        ctx.throw(400, message);  // ✅ ใช้ throw เพื่อไม่ให้มัน wrap object
      }
    }

    const updated = await strapi.entityService.update('api::vaccine-time-slot.vaccine-time-slot', id, {
      data: body,
      populate: ['vaccine'],
    });

    const vaccineTitle = updated?.vaccine?.title || updated?.vaccine?.data?.attributes?.title || 'ไม่ทราบชื่อวัคซีน';

    await adminLogHelper({
      action: 'vaccine_time_slot_updated',
      type: 'update',
      message: `แอดมิน ${user?.username} แก้ไขช่วงเวลาวัคซีน "${vaccineTitle}" (ID ${id})`,
      user: { id: user?.id },
      details: {
        before: existing,
        after: updated,
      },
    });

    return updated;
  },

  async delete(ctx) {
    const user = ctx.state.user;
    const { id } = ctx.params;

    const existing = await strapi.entityService.findOne('api::vaccine-time-slot.vaccine-time-slot', id, {
      populate: ['vaccine'],
    });

    if (!existing) return ctx.notFound('ไม่พบข้อมูลช่วงเวลาวัคซีน');

    const vaccineTitle = existing?.vaccine?.title || existing?.vaccine?.data?.attributes?.title || 'ไม่ทราบชื่อวัคซีน';

    await strapi.service('api::vaccine-time-slot.vaccine-time-slot').delete(id);

    await adminLogHelper({
      action: 'vaccine_time_slot_deleted',
      type: 'delete',
      message: `แอดมิน ${user?.username} ลบช่วงเวลาวัคซีน "${vaccineTitle}" (ID ${id})`,
      user: { id: user?.id },
      details: { before: existing },
    });

    return { message: 'ลบสำเร็จ' };
  },

}));
