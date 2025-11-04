
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

    const existingPatient = await strapi.db.query('api::patient.patient').findOne({
      where: { user: user.id },
      populate: ['user'],
    });

    if (existingPatient) {
      return ctx.conflict('ข้อมูลผู้ป่วยสำหรับผู้ใช้นี้มีอยู่แล้ว');
    }

    // Server-side validation
    const errors = [];
    const thaiEnglishRegex = /^[ก-๙a-zA-Z\s-]+$/;
    const phoneRegex = /^0[6-9][0-9]{8}$/;
    const today = new Date();

    if (!data.first_name || !data.first_name.trim()) {
      errors.push('ชื่อต้องไม่ว่างเปล่า');
    } else if (!thaiEnglishRegex.test(data.first_name)) {
      errors.push('ชื่อต้องประกอบด้วยตัวอักษรไทยหรืออังกฤษเท่านั้น');
    } else if (data.first_name.length > 50) {
      errors.push('ชื่อต้องไม่เกิน 50 ตัวอักษร');
    }

    if (!data.last_name || !data.last_name.trim()) {
      errors.push('นามสกุลต้องไม่ว่างเปล่า');
    } else if (!thaiEnglishRegex.test(data.last_name)) {
      errors.push('นามสกุลต้องประกอบด้วยตัวอักษรไทยหรืออังกฤษเท่านั้น');
    } else if (data.last_name.length > 50) {
      errors.push('นามสกุลต้องไม่เกิน 50 ตัวอักษร');
    }

    if (!data.birth_date) {
      errors.push('วันเกิดต้องไม่ว่างเปล่า');
    } else {
      const birthDate = new Date(data.birth_date);
      if (isNaN(birthDate.getTime())) {
        errors.push('วันเกิดไม่ถูกต้อง');
      } else if (birthDate > today) {
        errors.push('วันเกิดต้องไม่เป็นวันที่ในอนาคต');
      } else if ((today - birthDate) / (1000 * 60 * 60 * 24 * 365.25) < 1) {
        errors.push('ต้องมีอายุอย่างน้อย 1 ปี');
      }
    }

    if (!data.phone || !data.phone.trim()) {
      errors.push('เบอร์โทรศัพท์ต้องไม่ว่างเปล่า');
    } else if (!phoneRegex.test(data.phone)) {
      errors.push('เบอร์โทรศัพท์ต้องเป็น 10 หลัก เริ่มต้นด้วย 06, 08, หรือ 09');
    }

    if (!data.address || !data.address.trim()) {
      errors.push('ที่อยู่ต้องไม่ว่างเปล่า');
    } else if (data.address.length < 10) {
      errors.push('ที่อยู่ต้องมีอย่างน้อย 10 ตัวอักษร');
    } else if (data.address.length > 200) {
      errors.push('ที่อยู่ต้องไม่เกิน 200 ตัวอักษร');
    }

    if (!data.gender || !['male', 'female'].includes(data.gender)) {
      errors.push('เพศต้องเป็น ชาย หรือ หญิง');
    }

    if (!data.email || !data.email.trim()) {
      errors.push('อีเมลต้องไม่ว่างเปล่า');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('อีเมลไม่ถูกต้อง');
    }

    if (errors.length > 0) {
      return ctx.badRequest('ข้อมูลไม่ถูกต้อง: ' + errors.join('; '));
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
            user: created.user
              ? {
                  id: created.user.id,
                  username: created.user.username,
                  email: created.user.email,
                }
              : null,
            status: created.status,
          },
        },
      });

      return created;
    } catch (error) {
      console.error('❌ Error creating patient:', error);
      if (error.name === 'ValidationError' && error.details?.errors) {
        const messages = error.details.errors
          .map((e) => e.message || JSON.stringify(e))
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

    if (!user) {
      return ctx.unauthorized('คุณไม่ได้รับอนุญาต');
    }

    const existing = await strapi.entityService.findOne('api::patient.patient', id, {
      populate: ['user'],
    });

    if (!existing) {
      return ctx.notFound('ไม่พบข้อมูลผู้ป่วย');
    }

    // Check if user is admin
    const userWithRole = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, {
      populate: ['role'],
    });
    const isAdmin = userWithRole?.role?.name?.toLowerCase() === 'admin';

    // Allow admins to update any patient, restrict non-admins to their own records
    if (!isAdmin && existing.user?.id !== user.id) {
      return ctx.forbidden('คุณไม่มีสิทธิ์แก้ไขข้อมูลผู้ป่วยนี้');
    }

    // Server-side validation
    const errors = [];
    const thaiEnglishRegex = /^[ก-๙a-zA-Z\s-]+$/;
    const phoneRegex = /^0[6-9][0-9]{8}$/;
    const today = new Date();

    if (data.first_name && !data.first_name.trim()) {
      errors.push('ชื่อต้องไม่ว่างเปล่า');
    } else if (data.first_name && !thaiEnglishRegex.test(data.first_name)) {
      errors.push('ชื่อต้องประกอบด้วยตัวอักษรไทยหรืออังกฤษเท่านั้น');
    } else if (data.first_name && data.first_name.length > 50) {
      errors.push('ชื่อต้องไม่เกิน 50 ตัวอักษร');
    }

    if (data.last_name && !data.last_name.trim()) {
      errors.push('นามสกุลต้องไม่ว่างเปล่า');
    } else if (data.last_name && !thaiEnglishRegex.test(data.last_name)) {
      errors.push('นามสกุลต้องประกอบด้วยตัวอักษรไทยหรืออังกฤษเท่านั้น');
    } else if (data.last_name && data.last_name.length > 50) {
      errors.push('นามสกุลต้องไม่เกิน 50 ตัวอักษร');
    }

    if (data.birth_date) {
      const birthDate = new Date(data.birth_date);
      if (isNaN(birthDate.getTime())) {
        errors.push('วันเกิดไม่ถูกต้อง');
      } else if (birthDate > today) {
        errors.push('วันเกิดต้องไม่เป็นวันที่ในอนาคต');
      } else if ((today - birthDate) / (1000 * 60 * 60 * 24 * 365.25) < 1) {
        errors.push('ต้องมีอายุอย่างน้อย 1 ปี');
      }
    }

    if (data.phone && !data.phone.trim()) {
      errors.push('เบอร์โทรศัพท์ต้องไม่ว่างเปล่า');
    } else if (data.phone && !phoneRegex.test(data.phone)) {
      errors.push('เบอร์โทรศัพท์ต้องเป็น 10 หลัก เริ่มต้นด้วย 06, 08, หรือ 09');
    }

    if (data.address && !data.address.trim()) {
      errors.push('ที่อยู่ต้องไม่ว่างเปล่า');
    } else if (data.address && data.address.length < 10) {
      errors.push('ที่อยู่ต้องมีอย่างน้อย 10 ตัวอักษร');
    } else if (data.address && data.address.length > 200) {
      errors.push('ที่อยู่ต้องไม่เกิน 200 ตัวอักษร');
    }

    if (data.gender && !['male', 'female'].includes(data.gender)) {
      errors.push('เพศต้องเป็น ชาย หรือ หญิง');
    }

    if (data.email && !data.email.trim()) {
      errors.push('อีเมลต้องไม่ว่างเปล่า');
    } else if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('อีเมลไม่ถูกต้อง');
    }

    if (errors.length > 0) {
      return ctx.badRequest('ข้อมูลไม่ถูกต้อง: ' + errors.join('; '));
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
  },

  async find(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('คุณไม่ได้รับอนุญาต');
    }

    try {
      // Check if user has Admin role
      const userWithRole = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, {
        populate: ['role'],
      });
      const isAdmin = userWithRole?.role?.name?.toLowerCase() === 'admin';

      // Define filters based on role
      const filters = isAdmin
        ? {} // Admin sees all patients
        : { user: { id: user.id } }; // Non-admin sees only their own records

      const patients = await strapi.entityService.findMany('api::patient.patient', {
        filters,
        populate: ['user'],
      });

      return patients;
    } catch (error) {
      console.error('❌ Error fetching patients:', error);
      return ctx.internalServerError('ไม่สามารถดึงข้อมูลผู้ป่วยได้');
    }
  },
}));

