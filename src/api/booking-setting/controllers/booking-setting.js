'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const adminLogHelper = require('../../../utils/adminLogHelper');

module.exports = createCoreController('api::booking-setting.booking-setting', ({ strapi }) => ({

  async create(ctx) {
    const user = ctx.state.user;
    const body = ctx.request.body.data || ctx.request.body;

    const response = await strapi.service('api::booking-setting.booking-setting').create({
      data: body,
      populate: ['vaccine'],
    });

    const bookingSetting = response?.data || response;
    const vaccineTitle = bookingSetting?.vaccine?.title || bookingSetting?.vaccine?.name || 'ไม่ทราบชื่อวัคซีน';

    if (strapi.io && bookingSetting?.id) {
      strapi.io.emit('booking_setting_created', {
        id: bookingSetting.id,
        title: vaccineTitle,
        data: bookingSetting,
      });
    }

    await adminLogHelper({
      action: 'booking_setting_created',
      type: 'create',
      message: `แอดมิน ${user?.username} สร้างการตั้งค่าช่วงเวลาการจองสำหรับวัคซีน "${vaccineTitle}"`,
      user: { id: user?.id },
      details: {
        before: null,
        after: {
          advance_booking_days: bookingSetting.advance_booking_days,
          prevent_last_minute_minutes: bookingSetting.prevent_last_minute_minutes,
          slotDurationMinutes: bookingSetting.slotDurationMinutes,
          is_enabled: bookingSetting.is_enabled,
          vaccine: bookingSetting.vaccine?.id || null,
        },
      },
    });

    return response;
  },

  async update(ctx) {
    const user = ctx.state.user;
    const { id } = ctx.params;

    const existing = await strapi.entityService.findOne('api::booking-setting.booking-setting', id, {
      populate: ['vaccine'],
    });

    if (!existing) return ctx.notFound('ไม่พบการตั้งค่าช่วงเวลาการจอง');

    const body = ctx.request.body.data || ctx.request.body;

    const {
      advance_booking_days,
      prevent_last_minute_minutes,
      slotDurationMinutes,
      is_enabled,
    } = body;

    const updateData = {
      advance_booking_days,
      prevent_last_minute_minutes,
      slotDurationMinutes,
      is_enabled,
    };


    const bookingSetting = await strapi.entityService.update('api::booking-setting.booking-setting', id, {
      data: updateData,
      populate: ['vaccine'],
    });

    const oldVaccineTitle = existing?.vaccine?.title || 'ไม่ทราบชื่อเดิม';
    const newVaccineTitle = bookingSetting?.vaccine?.title || oldVaccineTitle;

    if (strapi.io && bookingSetting?.id) {
      strapi.io.emit('booking_setting_updated', {
        id: bookingSetting.id,
        oldData: existing,
        newData: bookingSetting,
      });
    }

    await adminLogHelper({
      action: 'booking_setting_updated',
      type: 'update',
      message: `แอดมิน ${user?.username} แก้ไขการตั้งค่าช่วงเวลาการจอง ID ${id} สำหรับวัคซีน "${oldVaccineTitle}"`,
      user: { id: user?.id },
      details: {
        before: {
          advance_booking_days: existing.advance_booking_days,
          prevent_last_minute_minutes: existing.prevent_last_minute_minutes,
          slotDurationMinutes: existing.slotDurationMinutes,
          is_enabled: existing.is_enabled,
          vaccine: existing.vaccine?.id || null,
        },
        after: {
          advance_booking_days: bookingSetting.advance_booking_days,
          prevent_last_minute_minutes: bookingSetting.prevent_last_minute_minutes,
          slotDurationMinutes: bookingSetting.slotDurationMinutes,
          is_enabled: bookingSetting.is_enabled,
          vaccine: bookingSetting.vaccine?.id || null,
        },
      },
    });

    return bookingSetting;
  },

  async delete(ctx) {
    const user = ctx.state.user;
    const { id } = ctx.params;

    const existing = await strapi.entityService.findOne('api::booking-setting.booking-setting', id, {
      populate: ['vaccine'],
    });

    if (!existing) return ctx.notFound('ไม่พบการตั้งค่าช่วงเวลาการจอง');

    const vaccineTitle = existing?.vaccine?.title || existing?.vaccine?.name || 'ไม่ทราบชื่อวัคซีน';

    await strapi.service('api::booking-setting.booking-setting').delete(id);

    if (strapi.io) {
      strapi.io.emit('booking_setting_deleted', {
        id: existing.id,
        title: vaccineTitle,
        data: existing,
      });
    }

    await adminLogHelper({
      action: 'booking_setting_deleted',
      type: 'delete',
      message: `แอดมิน ${user?.username} ลบการตั้งค่าช่วงเวลาการจองสำหรับวัคซีน "${vaccineTitle}"`,
      user: { id: user?.id },
      details: {
        before: {
          advance_booking_days: existing.advance_booking_days,
          prevent_last_minute_minutes: existing.prevent_last_minute_minutes,
          slotDurationMinutes: existing.slotDurationMinutes,
          is_enabled: existing.is_enabled,
          vaccine: existing.vaccine?.id || null,
        },
        after: null,
      },
    });

    return { message: 'ลบสำเร็จ' };
  }

}));
