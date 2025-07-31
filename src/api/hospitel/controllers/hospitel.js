'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const adminLogHelper = require('../../../utils/adminLogHelper');

module.exports = createCoreController('api::hospitel.hospitel', ({ strapi }) => ({
  async create(ctx) {
    try {
      const response = await super.create(ctx);

      // หลังสร้างสำเร็จ บันทึก log
      await adminLogHelper({
        action: 'hospitel_detail_created',
        type: 'create',
        message: `สร้างข้อมูล รายละเอียดใบนัด รายการ ID: ${response.data.id}`,
        user: { id: ctx.state.user?.id || null },
        details: { after: response.data.attributes },
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
    console.log('response update:', response);

    console.log('กำลังบันทึก log update hospitel...');
    await adminLogHelper({
      action: 'hospitel_detail_updated',
      type: 'update',
      message: `แก้ไขข้อมูล รายละเอียดใบนัด รายการ ID: ${id}`,
      user: { id: ctx.state.user?.id || null },
      details: {
        before: beforeUpdate,
        after: response.data.attributes,
      },
    });
    console.log('บันทึก log สำเร็จ');

    return response;
  } catch (error) {
    console.error('Error update hospitel:', error);
    ctx.throw(500, 'เกิดข้อผิดพลาดขณะแก้ไขข้อมูล hospitel');
  }
  }

}));
