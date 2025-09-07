'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const adminLogHelper = require('../../../utils/adminLogHelper');

module.exports = createCoreController('api::vaccine.vaccine', ({ strapi }) => ({

  async create(ctx) {
    const user = ctx.state.user;
    const inputData = ctx.request.body.data || ctx.request.body;

    // บังคับเช็ค title
    if (!inputData || !inputData.title || inputData.title.trim() === '') {
      return ctx.badRequest('กรุณาระบุชื่อวัคซีน');
    }

    try {
      const created = await strapi.entityService.create('api::vaccine.vaccine', {
        data: {
          ...inputData,
          publishedAt: new Date().toISOString(),
        },
        populate: '*',
      });

      const vaccine = created;

      const logData = {
        vaccineId: vaccine.id,
        vaccineTitle: vaccine.title ?? 'ไม่ทราบชื่อ',
        description: vaccine.description ?? null,
        gender: vaccine.gender ?? null,
        minAge: vaccine.minAge ?? null,
        maxAge: vaccine.maxAge ?? null,
        maxQuota: vaccine.maxQuota ?? null,
        booked: vaccine.booked ?? null,
        useTimeSlots: vaccine.useTimeSlots ?? null,
        serviceStartTime: vaccine.serviceStartTime ?? null,
        serviceEndTime: vaccine.serviceEndTime ?? null,
        bookingStartDate: vaccine.bookingStartDate ?? null,
        bookingEndDate: vaccine.bookingEndDate ?? null,
      };

      if (strapi.io && logData.vaccineId) {
        strapi.io.emit('vaccine_created', {
          id: logData.vaccineId,
          title: logData.vaccineTitle,
          data: vaccine,
        });
      }

      await adminLogHelper({
        action: 'vaccine_created',
        type: 'create',
        message: `แอดมิน ${user?.username || 'ไม่ทราบชื่อผู้ใช้'} ได้สร้างวัคซีนชื่อ ${logData.vaccineTitle}`,
        user,
        details: { after: logData },
      });

      return { data: vaccine };
    } catch (error) {
      strapi.log.error('Create vaccine error:', error);
      return ctx.internalServerError('เกิดข้อผิดพลาดในการสร้างวัคซีน');
    }
  },

  async update(ctx) {
    const user = ctx.state.user;
    const { id } = ctx.params;
    const inputData = ctx.request.body.data;

    if (!inputData) {
      return ctx.badRequest('Missing data object in request body');
    }

    // บังคับเช็ค title ถ้ามีการแก้ไข
    if ('title' in inputData && (!inputData.title || inputData.title.trim() === '')) {
      return ctx.badRequest('กรุณาระบุชื่อวัคซีน');
    }

    try {
      const beforeUpdate = await strapi.entityService.findOne('api::vaccine.vaccine', id);
      if (!beforeUpdate) {
        return ctx.notFound('ไม่พบวัคซีนที่ต้องการแก้ไข');
      }

      await strapi.entityService.update('api::vaccine.vaccine', id, {
        data: {
          ...inputData,
          publishedAt: new Date().toISOString(),
        },
      });

      const vaccine = await strapi.entityService.findOne('api::vaccine.vaccine', id);

      if (strapi.io) {
        strapi.io.emit('vaccine_updated', {
          id: vaccine.id,
          title: vaccine.title ?? 'ไม่ทราบชื่อ',
          data: vaccine,
        });
      }

      await adminLogHelper({
        action: 'vaccine_updated',
        type: 'update',
        message: `แอดมิน ${user?.username || 'ไม่ทราบชื่อผู้ใช้'} ได้แก้ไขวัคซีนชื่อ ${vaccine.title ?? 'ไม่ทราบชื่อ'} (ID ${id})`,
        user,
        details: {
          before: beforeUpdate,
          after: vaccine,
        },
      });

      return { data: vaccine };
    } catch (error) {
      strapi.log.error('Update vaccine error:', error);
      return ctx.internalServerError('เกิดข้อผิดพลาดในการอัปเดตวัคซีน');
    }
  },

  async delete(ctx) {
    const user = ctx.state.user;
    const { id } = ctx.params;

    try {
      const existing = await strapi.entityService.findOne('api::vaccine.vaccine', id);
      if (!existing) {
        return ctx.badRequest('ไม่พบวัคซีนที่ต้องการลบ');
      }

      const response = await strapi.entityService.delete('api::vaccine.vaccine', id);

      if (strapi.io) {
        strapi.io.emit('vaccine_deleted', {
          id: existing.id,
          title: existing.title || 'ไม่ทราบชื่อ',
          data: existing,
        });
      }

      await adminLogHelper({
        action: 'vaccine_deleted',
        type: 'delete',
        message: `แอดมิน ${user?.username || 'ไม่ทราบชื่อผู้ใช้'} ได้ลบวัคซีนชื่อ ${existing.title || 'ไม่ทราบชื่อ'} (ID ${id})`,
        user,
        details: existing,
      });

      return response;
    } catch (error) {
      strapi.log.error('Delete vaccine error:', error);
      return ctx.internalServerError('เกิดข้อผิดพลาดในการลบวัคซีน');
    }
  },

}));
