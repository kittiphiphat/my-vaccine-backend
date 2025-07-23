'use strict';

/**
 * admin-log service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::admin-log.admin-log');
