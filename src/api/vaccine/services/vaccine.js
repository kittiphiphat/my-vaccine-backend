'use strict';

/**
 * vaccine service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::vaccine.vaccine');
