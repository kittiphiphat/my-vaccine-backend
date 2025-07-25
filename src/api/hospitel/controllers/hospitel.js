'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const adminLogHelper = require('../../../utils/adminLogHelper'); // ปรับ path ตามที่เก็บจริง

module.exports = createCoreController('api::hospitel.hospitel', ({ strapi }) => ({
  async create(ctx) {
    try {
      const response = await super.create(ctx);

      // หลังสร้างสำเร็จ บันทึก log
      await adminLogHelper({
        action: 'hospitel_detail_created',
        type: 'create',
        message: `สร้างข้อมูล hospitel รายการ ID: ${response.data.id}`,
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

    // ดึงข้อมูลก่อนแก้ไข (เก็บไว้ใน log)
    const beforeUpdate = await strapi.entityService.findOne('api::hospitel.hospitel', id);

    try {
      const response = await super.update(ctx);

      // หลังแก้ไขสำเร็จ บันทึก log
      await adminLogHelper({
        action: 'hospitel_detail_updated',
        type: 'update',
        message: `แก้ไขข้อมูล hospitel รายการ ID: ${id}`,
        user: { id: ctx.state.user?.id || null },
        details: {
          before: beforeUpdate,
          after: response.data.attributes,
        },
      });

      return response;
    } catch (error) {
      ctx.throw(500, 'เกิดข้อผิดพลาดขณะแก้ไขข้อมูล hospitel');
    }
  },
}));
