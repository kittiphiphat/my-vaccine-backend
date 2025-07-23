'use strict';

/**
 * patient-log service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::patient-log.patient-log');
