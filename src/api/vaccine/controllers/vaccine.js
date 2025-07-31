'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const adminLogHelper = require('../../../utils/adminLogHelper');

module.exports = createCoreController('api::vaccine.vaccine', ({ strapi }) => ({

async create(ctx) {
  const user = ctx.state.user;

  // สร้างวัคซีน
  const created = await strapi.service('api::vaccine.vaccine').create(ctx.request.body);

  // ดึงข้อมูลวัคซีนเต็ม
  const vaccine = await strapi.entityService.findOne('api::vaccine.vaccine', created.id, { populate: '*' });

  // เตรียมข้อมูลสำหรับ log
  const logData = {
    vaccineId: vaccine.id,
    vaccineTitle: vaccine.title || 'ไม่ทราบชื่อ',
    minAge: vaccine.minAge ?? null,
    maxAge: vaccine.maxAge ?? null,
    gender: vaccine.gender ?? null,
    maxQuota: vaccine.maxQuota ?? null,
    bookingStartDate: vaccine.bookingStartDate ?? null,
    bookingEndDate: vaccine.bookingEndDate ?? null,
  };

  // ส่ง event
  if (strapi.io && logData.vaccineId) {
    strapi.io.emit('vaccine_created', {
      id: logData.vaccineId,
      title: logData.vaccineTitle,
      data: vaccine,
    });
  }

  // บันทึก log
  await adminLogHelper({
    action: 'vaccine_created',
    type: 'create',
    message: `แอดมิน ${user.username} ได้สร้างวัคซีนชื่อ ${logData.vaccineTitle}`,
    user,
    details: {
      after: logData,
    },
  });

  return { data: vaccine };
},



  async update(ctx) {
    const user = ctx.state.user;
    const { id } = ctx.params;

    // ดึงข้อมูลวัคซีนก่อนอัปเดต แบบไม่ใช้ populate (field ปกติ)
    const beforeUpdate = await strapi.entityService.findOne('api::vaccine.vaccine', id);



    if (!beforeUpdate) {
      return ctx.notFound('ไม่พบวัคซีนที่ต้องการแก้ไข');
    }

    // อัปเดตวัคซีน
    await strapi.service('api::vaccine.vaccine').update(id, ctx.request.body);

    // ดึงข้อมูลวัคซีนล่าสุดหลังอัปเดต
    const vaccine = await strapi.entityService.findOne('api::vaccine.vaccine', id);



    const vaccineId = vaccine.id;
    const vaccineTitle = vaccine.title ?? vaccine.attributes?.title ?? 'ไม่ทราบชื่อ';
    const vaccineTitleBefore = beforeUpdate.attributes?.title || 'ไม่ทราบชื่อ';

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
      message: `แอดมิน ${user?.username || 'ไม่ทราบชื่อผู้ใช้'} ได้แก้ไขวัคซีนชื่อ ${vaccineTitle} (ID ${id})`,
      user,
      details: {
        before: {
          vaccineId: beforeUpdate.id,
          vaccineTitle: beforeUpdate.title ?? 'ไม่ทราบชื่อ',
          minAge: beforeUpdate.minAge ?? null,
          maxAge: beforeUpdate.maxAge ?? null,
          gender: beforeUpdate.gender ?? null,
          maxQuota: beforeUpdate.maxQuota ?? null,
          bookingStartDate: beforeUpdate.bookingStartDate ?? null,
          bookingEndDate: beforeUpdate.bookingEndDate ?? null,
        },
        after: {
          vaccineId,
          vaccineTitle,
          minAge: vaccine.minAge ?? null,
          maxAge: vaccine.maxAge ?? null,
          gender: vaccine.gender ?? null,
          maxQuota: vaccine.maxQuota ?? null,
          bookingStartDate: vaccine.bookingStartDate ?? null,
          bookingEndDate: vaccine.bookingEndDate ?? null,
        },
      },
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
      details: {
        vaccineId: existing.id,
        vaccineTitle: existing.attributes?.title ?? null,
        minAge: existing.attributes?.minAge ?? null,
        maxAge: existing.attributes?.maxAge ?? null,
        gender: existing.attributes?.gender ?? null,
        maxQuota: existing.attributes?.maxQuota ?? null,
        bookingStartDate: existing.attributes?.bookingStartDate ?? null,
        bookingEndDate: existing.attributes?.bookingEndDate ?? null,
      },
    });

    return response;
  },

}));

