'use strict';

/**
 * vaccine-booking service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::vaccine-booking.vaccine-booking');
