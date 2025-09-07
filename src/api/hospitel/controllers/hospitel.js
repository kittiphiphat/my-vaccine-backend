'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const adminLogHelper = require('../../../utils/adminLogHelper');

module.exports = createCoreController('api::hospitel.hospitel', ({ strapi }) => ({

  async create(ctx) {
    try {
      const response = await super.create(ctx);
      const hospitel = response?.data || response;

      await adminLogHelper({
        action: 'hospitel_detail_created',
        type: 'create',
        message: `สร้างข้อมูล รายละเอียดใบนัด รายการ ID: ${hospitel.id}`,
        user: { id: ctx.state.user?.id || null },
        details: {
          before: null,
          after: {
            name: hospitel.attributes.name,
            warningtext: hospitel.attributes.warningtext,
            subwarningtext: hospitel.attributes.subwarningtext,
            phone: hospitel.attributes.phone,
            website: hospitel.attributes.website,
          },
        },
      });

      return response;
    } catch (error) {
      ctx.throw(500, 'เกิดข้อผิดพลาดขณะสร้างข้อมูล hospitel');
    }
  },

  async update(ctx) {
    const { id } = ctx.params;

    const beforeUpdate = await strapi.entityService.findOne('api::hospitel.hospitel', id);

    try {
      const response = await super.update(ctx);
      const hospitel = response?.data || response;

      await adminLogHelper({
        action: 'hospitel_detail_updated',
        type: 'update',
        message: `แก้ไขข้อมูล รายละเอียดใบนัด รายการ ID: ${id}`,
        user: { id: ctx.state.user?.id || null },
        details: {
          before: {
            name: beforeUpdate.name,
            warningtext: beforeUpdate.warningtext,
            subwarningtext: beforeUpdate.subwarningtext,
            phone: beforeUpdate.phone,
            website: beforeUpdate.website,
          },
          after: {
            name: hospitel.attributes.name,
            warningtext: hospitel.attributes.warningtext,
            subwarningtext: hospitel.attributes.subwarningtext,
            phone: hospitel.attributes.phone,
            website: hospitel.attributes.website,
          },
        },
      });

      return response;
    } catch (error) {
      ctx.throw(500, 'เกิดข้อผิดพลาดขณะแก้ไขข้อมูล hospitel');
    }
  }

}));
