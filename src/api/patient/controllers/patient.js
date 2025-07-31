'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const adminLogHelper = require('../../../utils/adminLogHelper');
const patientLogHelper = require('../../../utils/patientLogHelper');

module.exports = createCoreController('api::patient.patient', ({ strapi }) => ({

async create(ctx) {
    const user = ctx.state.user;
    const data = ctx.request.body.data || ctx.request.body;

    if (!user) {
      return ctx.unauthorized('คุณไม่ได้รับอนุญาต');
    }

    try {
      // สร้างข้อมูลผู้ป่วย
      const created = await strapi.entityService.create('api::patient.patient', { data });

      const patientName = `${created.first_name || ''} ${created.last_name || ''}`.trim();

      // บันทึก log ผ่าน helper
      await patientLogHelper({
        action: 'patient_created',
        type: 'create',
        message: `ผู้ใช้ ${user.username} สร้างข้อมูลผู้ป่วย ${patientName} (ID ${created.id})`,
        user: { id: user.id },
        details: created,
      });

      return created;
    } catch (error) {
      console.error('❌ Error creating patient:', error);
      return ctx.internalServerError('ไม่สามารถสร้างข้อมูลผู้ป่วยได้');
    }
  },


  async update(ctx) {
    const user = ctx.state.user;
    const { id } = ctx.params;
    const data = ctx.request.body.data || ctx.request.body;

    if (!user) {
      return ctx.unauthorized('คุณไม่ได้รับอนุญาต');
    }

    const existing = await strapi.entityService.findOne('api::patient.patient', id);

    if (!existing) {
      return ctx.notFound('ไม่พบข้อมูลผู้ป่วย');
    }

    try {
      const updated = await strapi.entityService.update('api::patient.patient', id, { data });

      const patientName = `${existing.first_name || ''} ${existing.last_name || ''}`.trim();

      await adminLogHelper({
        action: 'patient_updated',
        type: 'update',
        message: `ผู้ใช้ ${user.username} แก้ไขข้อมูลผู้ป่วย ${patientName} (ID ${id})`,
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
      // ลบข้อมูลผู้ป่วยจริง ๆ
      await strapi.entityService.delete('api::patient.patient', id);

      const patientName = `${existing.first_name || ''} ${existing.last_name || ''}`.trim();

      await adminLogHelper({
        action: 'patient_deleted',
        type: 'delete',
        message: `ผู้ใช้ ${user.username} ลบข้อมูลผู้ป่วย ${patientName} (ID ${id})`,
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
