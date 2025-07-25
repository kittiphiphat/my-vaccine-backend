'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const adminLogHelper = require('../../../utils/adminLogHelper'); // ปรับ path ให้ตรงกับโปรเจกต์คุณ

module.exports = createCoreController('api::patient.patient', ({ strapi }) => ({

  async update(ctx) {
    const user = ctx.state.user;
    const { id } = ctx.params;
    const data = ctx.request.body.data || ctx.request.body;

    if (!user) {
      return ctx.unauthorized('คุณไม่ได้รับอนุญาต');
    }

    // หา record เดิมก่อน update
    const existing = await strapi.entityService.findOne('api::patient.patient', id);

    if (!existing) {
      return ctx.notFound('ไม่พบข้อมูลผู้ป่วย');
    }

    try {
      const updated = await strapi.entityService.update('api::patient.patient', id, { data });

      // บันทึก log
      await adminLogHelper({
        action: 'patient_updated',
        type: 'update',
        message: `ผู้ใช้ ${user.username} แก้ไขข้อมูลผู้ป่วย (ID ${id})`,
        user: { id: user.id },
        details: {
          before: existing,
          after: updated,
        },
      });

      return updated;
    } catch (error) {
      console.error('❌ Error updating patient:', error);
      return ctx.internalServerError('ไม่สามารถแก้ไขข้อมูลผู้ป่วยได้');
    }
  },

  async delete(ctx) {
    const user = ctx.state.user;
    const { id } = ctx.params;

    if (!user) {
      return ctx.unauthorized('คุณไม่ได้รับอนุญาต');
    }

    const existing = await strapi.entityService.findOne('api::patient.patient', id);

    if (!existing) {
      return ctx.notFound('ไม่พบข้อมูลผู้ป่วย');
    }

    try {
      await strapi.entityService.delete('api::patient.patient', id);

      // บันทึก log
      await adminLogHelper({
        action: 'patient_deleted',
        type: 'delete',
        message: `ผู้ใช้ ${user.username} ลบข้อมูลผู้ป่วย (ID ${id})`,
        user: { id: user.id },
        details: {
          before: existing,
        },
      });

      return { message: 'ลบข้อมูลผู้ป่วยเรียบร้อยแล้ว' };
    } catch (error) {
      console.error('❌ Error deleting patient:', error);
      return ctx.internalServerError('ไม่สามารถลบข้อมูลผู้ป่วยได้');
    }
  },

}));
