'use strict';

/**
 * vaccine controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::vaccine.vaccine', ({ strapi }) => ({
  async create(ctx) {
    // เรียกใช้ service เพื่อสร้าง vaccine
    const response = await strapi.service('api::vaccine.vaccine').create(ctx.request.body);

    // ส่ง event ผ่าน WebSocket
    if (strapi.io) {
      strapi.io.emit('vaccine_created', {
        id: response.id,
        title: response.title,
        data: response,
      });
    }

    return response;
  },
}));

