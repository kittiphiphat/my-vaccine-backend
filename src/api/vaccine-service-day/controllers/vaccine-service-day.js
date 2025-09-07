'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const adminLogHelper = require('../../../utils/adminLogHelper');

module.exports = createCoreController('api::vaccine-service-day.vaccine-service-day', ({ strapi }) => ({

 async create(ctx) {
    const user = ctx.state.user;
    const { day_of_week, vaccine } = ctx.request.body.data || ctx.request.body;

    const existing = await strapi.db.query('api::vaccine-service-day.vaccine-service-day').findOne({
      where: {
        day_of_week: { $in: day_of_week },
        vaccine: vaccine?.id || vaccine,
      },
    });

    if (existing) {
      return ctx.badRequest('ไม่สามารถเพิ่มวันให้บริการนี้ได้ เพราะมีอยู่แล้ว');
    }

    const response = await strapi.service('api::vaccine-service-day.vaccine-service-day').create({
      data: {
        day_of_week,
        vaccine: vaccine?.id || vaccine,
      },
      populate: ['vaccine'],
    });

    const created = response;
    const vaccineTitle = created?.vaccine?.title || created?.vaccine?.data?.attributes?.title || 'ไม่ทราบชื่อวัคซีน';

    await adminLogHelper({
      action: 'vaccine_service_day_created',
      type: 'create',
      message: `แอดมิน ${user?.username} สร้างวันให้บริการวัคซีน ${vaccineTitle} (ID ${created.id})`,
      user: { id: user?.id },
      details: {
        after: created,
      },
    });

    return response;
  },

  async update(ctx) {
    const user = ctx.state.user;
    const { id } = ctx.params;
    const body = ctx.request.body.data || ctx.request.body;

    const existing = await strapi.entityService.findOne('api::vaccine-service-day.vaccine-service-day', id, {
      populate: ['vaccine'],
    });

    if (!existing) {
      return ctx.notFound('ไม่พบข้อมูลวันให้บริการวัคซีน');
    }

    const updated = await strapi.entityService.update('api::vaccine-service-day.vaccine-service-day', id, {
      data: body,
      populate: ['vaccine'],
    });

    const vaccineTitle = updated?.vaccine?.title || updated?.vaccine?.data?.attributes?.title || 'ไม่ทราบชื่อวัคซีน';

    await adminLogHelper({
      action: 'vaccine_service_day_updated',
      type: 'update',
      message: `แอดมิน ${user?.username} แก้ไขวันให้บริการวัคซีน ${vaccineTitle} (ID ${id})`,
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

    const existing = await strapi.entityService.findOne('api::vaccine-service-day.vaccine-service-day', id, {
      populate: ['vaccine'],
    });

    if (!existing) {
      return ctx.notFound('ไม่พบข้อมูลวันให้บริการวัคซีน');
    }

    const vaccineTitle = existing?.vaccine?.title || existing?.vaccine?.data?.attributes?.title || 'ไม่ทราบชื่อวัคซีน';

    await strapi.entityService.delete('api::vaccine-service-day.vaccine-service-day', id);

    await adminLogHelper({
      action: 'vaccine_service_day_deleted',
      type: 'delete',
      message: `แอดมิน ${user?.username} ลบวันให้บริการวัคซีน ${vaccineTitle} (ID ${id})`,
      user: { id: user?.id },
      details: {
        before: existing,
      },
    });

    return { message: 'ลบสำเร็จ' };
  },

}));
