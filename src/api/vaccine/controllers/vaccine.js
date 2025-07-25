'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const adminLogHelper = require('../../../utils/adminLogHelper');

module.exports = createCoreController('api::vaccine.vaccine', ({ strapi }) => ({

  async create(ctx) {
    const user = ctx.state.user;

    // สร้างวัคซีน
    const created = await strapi.service('api::vaccine.vaccine').create(ctx.request.body);

    // ดึงข้อมูลวัคซีนใหม่จาก DB เต็มรูปแบบ (มี id และ attributes)
    const vaccine = await strapi.entityService.findOne('api::vaccine.vaccine', created.id);

    const vaccineId = vaccine.id;
    const vaccineTitle = vaccine.attributes?.title || 'ไม่ทราบชื่อ';

    if (strapi.io && vaccineId) {
      strapi.io.emit('vaccine_created', {
        id: vaccineId,
        title: vaccineTitle,
        data: vaccine,
      });
    }

    await adminLogHelper({
      action: 'vaccine_created',
      type: 'create',
      message: `แอดมิน ${user.username} ได้สร้างวัคซีนชื่อ ${vaccineTitle}`,
      user,
    });

    // return response ในรูปแบบ data ตาม Strapi API
    return { data: vaccine };
  },

  async update(ctx) {
    const user = ctx.state.user;
    const { id } = ctx.params;

    // อัปเดตวัคซีน
    await strapi.service('api::vaccine.vaccine').update(id, ctx.request.body);

    // ดึงข้อมูลวัคซีนล่าสุดจาก DB
    const vaccine = await strapi.entityService.findOne('api::vaccine.vaccine', id);

    const vaccineId = vaccine.id;
    const vaccineTitle = vaccine.attributes?.title || 'ไม่ทราบชื่อ';

    if (strapi.io && vaccineId) {
      strapi.io.emit('vaccine_updated', {
        id: vaccineId,
        title: vaccineTitle,
        data: vaccine,
      });
    }

    await adminLogHelper({
      action: 'vaccine_updated',
      type: 'update',
      message: `แอดมิน ${user.username} ได้แก้ไขวัคซีนชื่อ ${vaccineTitle} (ID ${id})`,
      user,
    });

    return { data: vaccine };
  },

  async delete(ctx) {
    const user = ctx.state.user;
    const { id } = ctx.params;

    const existing = await strapi.entityService.findOne('api::vaccine.vaccine', id);

    if (!existing) {
      return ctx.badRequest('ไม่พบวัคซีนที่ต้องการลบ');
    }

    const response = await strapi.service('api::vaccine.vaccine').delete(id);

    if (strapi.io) {
      strapi.io.emit('vaccine_deleted', {
        id: existing.id,
        title: existing.attributes?.title || 'ไม่ทราบชื่อ',
        data: existing,
      });
    }

    await adminLogHelper({
      action: 'vaccine_deleted',
      type: 'delete',
      message: `แอดมิน ${user.username} ได้ลบวัคซีนชื่อ ${existing.attributes?.title || 'ไม่ทราบชื่อ'} (ID ${id})`,
      user,
    });

    return response;
  },

}));
