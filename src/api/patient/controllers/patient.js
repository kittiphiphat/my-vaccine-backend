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
    const created = await strapi.entityService.create('api::patient.patient', {
      data: {
        ...data,
        user: user.id,
      },
      populate: ['user'],
    });

    const patientName = `${created.first_name || ''} ${created.last_name || ''}`.trim();

    await patientLogHelper({
      action: 'patient_created',
      type: 'create',
      message: `ผู้ใช้ ${user.username} สร้างข้อมูลผู้ป่วย ${patientName} (ID ${created.id})`,
      user: { id: user.id },
      details: {
        before: null,
        after: {
          first_name: created.first_name,
          last_name: created.last_name,
          birth_date: created.birth_date,
          age: created.age,
          phone: created.phone,
          address: created.address,
          gender: created.gender,
          email: created.email,
          user: created.user ? {
            id: created.user.id,
            username: created.user.username,
            email: created.user.email,
          } : null,
          status: created.status,
        },
      },
    });

    return created;
  } catch (error) {
    if (error.details && error.details.errors) {
      console.error('Validation errors:');
      error.details.errors.forEach((e, i) => {
        console.error(`Error ${i + 1}:`, JSON.stringify(e, null, 2));
      });
    } else {
      console.error('❌ Error creating patient:', error);
    }

    if (error.details && error.details.errors) {
      const messages = error.details.errors
        .map(e => e.message || JSON.stringify(e))
        .join('; ');
      return ctx.badRequest(`ข้อมูลไม่ถูกต้อง: ${messages}`);
    }

    return ctx.internalServerError('ไม่สามารถสร้างข้อมูลผู้ป่วยได้');
  }
  },



 async update(ctx) {
  const user = ctx.state.user;
  const { id } = ctx.params;
  const data = ctx.request.body.data || ctx.request.body;
  console.log('Received data:', data);

  if (!user) {
    return ctx.unauthorized('คุณไม่ได้รับอนุญาต');
  }


  const existing = await strapi.entityService.findOne('api::patient.patient', id, {
    populate: ['user'],
  });

  if (!existing) {
    return ctx.notFound('ไม่พบข้อมูลผู้ป่วย');
  }

  try {

    const updated = await strapi.entityService.update('api::patient.patient', id, {
      data,
      populate: ['user'],
    });

    const patientName = `${existing.first_name || ''} ${existing.last_name || ''}`.trim();

    const logData = {
      action:
        existing.status !== 'cancelled' && data.status === 'cancelled'
          ? 'patient_deleted'
          : 'patient_updated',
      type:
        existing.status !== 'cancelled' && data.status === 'cancelled'
          ? 'delete'
          : 'update',
      message: `ผู้ใช้ ${user.username} ${
        existing.status !== 'cancelled' && data.status === 'cancelled'
          ? 'ลบ'
          : 'แก้ไข'
      }ข้อมูลผู้ป่วย ${patientName} (ID ${id})`,
      user: { id: user.id },
      details: {
        before: {
          first_name: existing.first_name,
          last_name: existing.last_name,
          birth_date: existing.birth_date,
          age: existing.age,
          phone: existing.phone,
          address: existing.address,
          gender: existing.gender,
          email: existing.email,
          user: existing.user
            ? {
                id: existing.user.id,
                username: existing.user.username,
                email: existing.user.email,
              }
            : null,
          status: existing.status,
        },
        after: {
          first_name: updated.first_name,
          last_name: updated.last_name,
          birth_date: updated.birth_date,
          age: updated.age,
          phone: updated.phone,
          address: updated.address,
          gender: updated.gender,
          email: updated.email,
          user: updated.user
            ? {
                id: updated.user.id,
                username: updated.user.username,
                email: updated.user.email,
              }
            : null,
          status: updated.status,
        },
      },
    };

    await adminLogHelper(logData);

    return updated;
  } catch (error) {
    console.error('❌ Error updating patient:', error);
    return ctx.internalServerError('ไม่สามารถแก้ไขข้อมูลผู้ป่วยได้');
  }
}


}));
