'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const adminLogHelper = require('../../../utils/adminLogHelper');

module.exports = createCoreController('api::vaccine.vaccine', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('คุณไม่ได้รับอนุญาต');
    }

    // Check if user is admin
    const userWithRole = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, {
      populate: ['role'],
    });
    const isAdmin = userWithRole?.role?.name?.toLowerCase() === 'admin';
    if (!isAdmin) {
      return ctx.forbidden('เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถสร้างข้อมูลวัคซีนได้');
    }

    const inputData = ctx.request.body.data || ctx.request.body;
    if (!inputData || !inputData.title || inputData.title.trim() === '') {
      return ctx.badRequest('กรุณาระบุชื่อวัคซีน');
    }

    try {
      const created = await strapi.entityService.create('api::vaccine.vaccine', {
        data: {
          ...inputData,
          publishedAt: new Date().toISOString(),
        },
        populate: '*',
      });

      const vaccine = {
        id: created.id,
        attributes: {
          title: created.title ?? 'ไม่ทราบชื่อ',
          description: created.description ?? null,
          gender: created.gender ?? null,
          minAge: created.minAge ?? null,
          maxAge: created.maxAge ?? null,
          maxQuota: created.maxQuota ?? null,
          booked: created.booked ?? null,
          useTimeSlots: created.useTimeSlots ?? null,
          serviceStartTime: created.serviceStartTime ?? null,
          serviceEndTime: created.serviceEndTime ?? null,
          bookingStartDate: created.bookingStartDate ?? null,
          bookingEndDate: created.bookingEndDate ?? null,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
          publishedAt: created.publishedAt,
        },
      };

      if (strapi.io) {
        strapi.io.emit('vaccine_created', {
          id: vaccine.id,
          title: vaccine.attributes.title,
          data: vaccine,
        });
      }

      await adminLogHelper({
        action: 'vaccine_created',
        type: 'create',
        message: `ผู้ใช้ ${user?.username || 'ไม่ทราบชื่อผู้ใช้'} สร้างวัคซีนชื่อ ${vaccine.attributes.title}`,
        user: { id: user.id },
        details: { after: vaccine.attributes },
      });

      return { data: vaccine };
    } catch (error) {
      strapi.log.error('Create vaccine error:', error);
      if (error.name === 'ValidationError' && error.details?.errors) {
        const messages = error.details.errors
          .map((e) => e.message || JSON.stringify(e))
          .join('; ');
        return ctx.badRequest(`ข้อมูลไม่ถูกต้อง: ${messages}`);
      }
      return ctx.internalServerError('เกิดข้อผิดพลาดในการสร้างวัคซีน');
    }
  },

  async update(ctx) {
    const user = ctx.state.user;
    const { id } = ctx.params;
    const inputData = ctx.request.body.data;

    if (!user) {
      return ctx.unauthorized('คุณไม่ได้รับอนุญาต');
    }

    const userWithRole = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, {
      populate: ['role'],
    });
    const isAdmin = userWithRole?.role?.name?.toLowerCase() === 'admin';
    if (!isAdmin) {
      return ctx.forbidden('เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถแก้ไขข้อมูลวัคซีนได้');
    }

    if (!inputData) {
      return ctx.badRequest('Missing data object in request body');
    }

    if ('title' in inputData && (!inputData.title || inputData.title.trim() === '')) {
      return ctx.badRequest('กรุณาระบุชื่อวัคซีน');
    }

    try {
      const beforeUpdate = await strapi.entityService.findOne('api::vaccine.vaccine', id, { populate: '*' });
      if (!beforeUpdate) {
        return ctx.notFound('ไม่พบวัคซีนที่ต้องการแก้ไข');
      }

      const updated = await strapi.entityService.update('api::vaccine.vaccine', id, {
        data: {
          ...inputData,
          publishedAt: new Date().toISOString(),
        },
        populate: '*',
      });

      const vaccine = {
        id: updated.id,
        attributes: {
          title: updated.title ?? 'ไม่ทราบชื่อ',
          description: updated.description ?? null,
          gender: updated.gender ?? null,
          minAge: updated.minAge ?? null,
          maxAge: updated.maxAge ?? null,
          maxQuota: updated.maxQuota ?? null,
          booked: updated.booked ?? null,
          useTimeSlots: updated.useTimeSlots ?? null,
          serviceStartTime: updated.serviceStartTime ?? null,
          serviceEndTime: updated.serviceEndTime ?? null,
          bookingStartDate: updated.bookingStartDate ?? null,
          bookingEndDate: updated.bookingEndDate ?? null,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
          publishedAt: updated.publishedAt,
        },
      };

      if (strapi.io) {
        strapi.io.emit('vaccine_updated', {
          id: vaccine.id,
          title: vaccine.attributes.title,
          data: vaccine,
        });
      }

      await adminLogHelper({
        action: 'vaccine_updated',
        type: 'update',
        message: `ผู้ใช้ ${user?.username || 'ไม่ทราบชื่อผู้ใช้'} แก้ไขวัคซีนชื่อ ${vaccine.attributes.title} (ID ${id})`,
        user: { id: user.id },
        details: {
          before: {
            title: beforeUpdate.title,
            description: beforeUpdate.description,
            gender: beforeUpdate.gender,
            minAge: beforeUpdate.minAge,
            maxAge: beforeUpdate.maxAge,
            maxQuota: beforeUpdate.maxQuota,
            booked: beforeUpdate.booked,
            useTimeSlots: beforeUpdate.useTimeSlots,
            serviceStartTime: beforeUpdate.serviceStartTime,
            serviceEndTime: beforeUpdate.serviceEndTime,
            bookingStartDate: beforeUpdate.bookingStartDate,
            bookingEndDate: beforeUpdate.bookingEndDate,
          },
          after: vaccine.attributes,
        },
      });

      return { data: vaccine };
    } catch (error) {
      strapi.log.error('Update vaccine error:', error);
      if (error.name === 'ValidationError' && error.details?.errors) {
        const messages = error.details.errors
          .map((e) => e.message || JSON.stringify(e))
          .join('; ');
        return ctx.badRequest(`ข้อมูลไม่ถูกต้อง: ${messages}`);
      }
      return ctx.internalServerError('เกิดข้อผิดพลาดในการอัปเดตวัคซีน');
    }
  },

async delete(ctx) {
  const user = ctx.state.user;
  const { id } = ctx.params;

  if (!user) {
    strapi.log.error('Delete vaccine: Unauthorized - No user found');
    return ctx.unauthorized('คุณไม่ได้รับอนุญาต');
  }

  // Check if user is admin
  const userWithRole = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, {
    populate: ['role'],
  });
  if (!userWithRole) {
    strapi.log.error(`Delete vaccine: User not found for ID ${user.id}`);
    return ctx.notFound('ไม่พบผู้ใช้');
  }
  const isAdmin = userWithRole?.role?.name?.toLowerCase() === 'admin';
  if (!isAdmin) {
    strapi.log.error(`Delete vaccine: User ${user.username} is not an admin`);
    return ctx.forbidden('เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถลบข้อมูลวัคซีนได้');
  }

  try {
    // Check if vaccine model exists
    const vaccineModel = strapi.contentTypes['api::vaccine.vaccine'];
    if (!vaccineModel) {
      strapi.log.error('Delete vaccine: Vaccine content type not found');
      return ctx.internalServerError('Content type api::vaccine.vaccine not found');
    }

    // Check if vaccine-booking model exists
    const bookingModel = strapi.contentTypes['api::vaccine-booking.vaccine-booking'];
    if (!bookingModel) {
      strapi.log.error('Delete vaccine: Vaccine-booking content type not found');
      return ctx.internalServerError('Content type api::vaccine-booking.vaccine-booking not found');
    }

    // Check if vaccine exists
    strapi.log.info(`Delete vaccine: Checking for vaccine ID ${id}`);
    const existing = await strapi.entityService.findOne('api::vaccine.vaccine', id, { populate: '*' });
    if (!existing) {
      strapi.log.error(`Delete vaccine: Vaccine not found for ID ${id}`);
      return ctx.badRequest('ไม่พบวัคซีนที่ต้องการลบ');
    }

    // Find and cancel active bookings
    strapi.log.info(`Delete vaccine: Checking for confirmed bookings for vaccine ID ${id}`);
    const activeBookings = await strapi.entityService.findMany('api::vaccine-booking.vaccine-booking', {
      filters: {
        vaccine: id,
        booking_status: 'confirmed',
      },
    });
    strapi.log.info(`Delete vaccine: Found ${activeBookings.length} confirmed bookings`);

    if (activeBookings.length > 0) {
      for (const booking of activeBookings) {
        try {
          await strapi.entityService.update('api::vaccine-booking.vaccine-booking', booking.id, {
            data: {
              booking_status: 'cancelled',
              updatedAt: new Date().toISOString(),
            },
          });
          strapi.log.info(`Delete vaccine: Cancelled booking ID ${booking.id}`);

          // Log cancellation
          await adminLogHelper({
            action: 'booking_cancelled',
            type: 'update',
            message: `ระบบยกเลิกการจอง ID ${booking.id} สำหรับวัคซีน ${existing.title} (ID ${id}) เนื่องจากการลบวัคซีน`,
            user: { id: user.id },
            details: { bookingId: booking.id, vaccineId: id },
          });

          // Emit cancellation event
          if (strapi.io) {
            strapi.io.emit('booking_cancelled', {
              id: booking.id,
              vaccineId: id,
              userId: booking.users_permissions_user?.id || null,
            });
          }
        } catch (bookingError) {
          strapi.log.error(`Delete vaccine: Failed to cancel booking ID ${booking.id}`, {
            error: bookingError.message,
            stack: bookingError.stack,
          });
          throw new Error(`Failed to cancel booking ID ${booking.id}: ${bookingError.message}`);
        }
      }
    }

    // Proceed with deletion
    strapi.log.info(`Delete vaccine: Deleting vaccine ID ${id}`);
    const deleted = await strapi.entityService.delete('api::vaccine.vaccine', id);

    // Emit deletion event
    if (strapi.io) {
      strapi.io.emit('vaccine_deleted', {
        id: existing.id,
        title: existing.title || 'ไม่ทราบชื่อ',
        data: existing,
      });
    }

    // Log deletion
    await adminLogHelper({
      action: 'vaccine_deleted',
      type: 'delete',
      message: `ผู้ใช้ ${user?.username || 'ไม่ทราบชื่อผู้ใช้'} ลบวัคซีนชื่อ ${existing.title || 'ไม่ทราบชื่อ'} (ID ${id})`,
      user: { id: user.id },
      details: {
        title: existing.title,
        description: existing.description,
        gender: existing.gender,
        minAge: existing.minAge,
        maxAge: existing.maxAge,
        maxQuota: existing.maxQuota,
        booked: existing.booked,
        useTimeSlots: existing.useTimeSlots,
        serviceStartTime: existing.serviceStartTime,
        serviceEndTime: existing.serviceEndTime,
        bookingStartDate: existing.bookingStartDate,
        bookingEndDate: existing.bookingEndDate,
      },
    });

    strapi.log.info(`Delete vaccine: Successfully deleted vaccine ID ${id}`);
    return { data: deleted };
  } catch (error) {
    strapi.log.error('Delete vaccine error:', {
      message: error.message,
      stack: error.stack,
      details: error.details || 'No additional details',
    });
    return ctx.internalServerError(`เกิดข้อผิดพลาดในการลบวัคซีน: ${error.message || 'Unknown error'}`);
  }
},

  // Custom endpoint for booking a vaccine
  async book(ctx) {
    const user = ctx.state.user;
    const { vaccineId } = ctx.request.body;

    if (!user) {
      return ctx.unauthorized('คุณไม่ได้รับอนุญาต');
    }

    if (!vaccineId) {
      return ctx.badRequest('กรุณาระบุ ID ของวัคซีน');
    }

    try {
      // Check if vaccine exists
      const vaccine = await strapi.entityService.findOne('api::vaccine.vaccine', vaccineId, { populate: '*' });
      if (!vaccine) {
        return ctx.notFound('ไม่พบวัคซีน');
      }

      // Check if user already has an active appointment for this vaccine
      const existingAppointment = await strapi.entityService.findMany('api::appointment.appointment', {
        filters: {
          vaccine: vaccineId,
          user: user.id,
          status: 'active',
        },
      });

      if (existingAppointment.length > 0) {
        return ctx.forbidden('คุณมีใบนัดที่ยังไม่ยกเลิกสำหรับวัคซีนนี้');
      }

      // Check quota
      if (vaccine.maxQuota && vaccine.booked >= vaccine.maxQuota) {
        return ctx.badRequest('โควตาการจองวัคซีนนี้เต็มแล้ว');
      }


      const appointment = await strapi.entityService.create('api::appointment.appointment', {
        data: {
          vaccine: vaccineId,
          user: user.id,
          status: 'active',
          bookedAt: new Date().toISOString(),
          publishedAt: new Date().toISOString(),
        },
      });

      // Update booked count
      await strapi.entityService.update('api::vaccine.vaccine', vaccineId, {
        data: {
          booked: (vaccine.booked || 0) + 1,
        },
      });

      if (strapi.io) {
        strapi.io.emit('appointment_created', {
          id: appointment.id,
          vaccineId,
          userId: user.id,
        });
      }

      await adminLogHelper({
        action: 'appointment_created',
        type: 'create',
        message: `ผู้ใช้ ${user.username} จองวัคซีน ${vaccine.title} (ID ${vaccineId})`,
        user: { id: user.id },
        details: { appointmentId: appointment.id, vaccineId },
      });

      return { data: appointment };
    } catch (error) {
      strapi.log.error('Book vaccine error:', error);
      if (error.name === 'ValidationError' && error.details?.errors) {
        const messages = error.details.errors
          .map((e) => e.message || JSON.stringify(e))
          .join('; ');
        return ctx.badRequest(`ข้อมูลไม่ถูกต้อง: ${messages}`);
      }
      return ctx.internalServerError('เกิดข้อผิดพลาดในการจองวัคซีน');
    }
  },

  // Custom endpoint for cancelling an appointment
  async cancelAppointment(ctx) {
    const user = ctx.state.user;
    const { appointmentId } = ctx.request.body;

    if (!user) {
      return ctx.unauthorized('คุณไม่ได้รับอนุญาต');
    }

    if (!appointmentId) {
      return ctx.badRequest('กรุณาระบุ ID ของใบนัด');
    }

    try {
      // Check if appointment exists
      const appointment = await strapi.entityService.findOne('api::appointment.appointment', appointmentId, {
        populate: ['vaccine', 'user'],
      });
      if (!appointment) {
        return ctx.notFound('ไม่พบใบนัด');
      }

      // Check if user owns the appointment
      if (appointment.user.id !== user.id) {
        return ctx.forbidden('คุณไม่มีสิทธิ์ยกเลิกใบนัดนี้');
      }

      // Update appointment status to cancelled
      const updatedAppointment = await strapi.entityService.update('api::appointment.appointment', appointmentId, {
        data: {
          status: 'cancelled',
        },
      });

      // Decrease booked count
      const vaccine = appointment.vaccine;
      if (vaccine && vaccine.booked > 0) {
        await strapi.entityService.update('api::vaccine.vaccine', vaccine.id, {
          data: {
            booked: vaccine.booked - 1,
          },
        });
      }

      if (strapi.io) {
        strapi.io.emit('appointment_cancelled', {
          id: appointmentId,
          vaccineId: vaccine.id,
          userId: user.id,
        });
      }

      await adminLogHelper({
        action: 'appointment_cancelled',
        type: 'update',
        message: `ผู้ใช้ ${user.username} ยกเลิกใบนัดสำหรับวัคซีน ${vaccine.title} (ID ${vaccine.id})`,
        user: { id: user.id },
        details: { appointmentId, vaccineId: vaccine.id },
      });

      return { data: updatedAppointment };
    } catch (error) {
      strapi.log.error('Cancel appointment error:', error);
      return ctx.internalServerError('เกิดข้อผิดพลาดในการยกเลิกใบนัด');
    }
  },
}));
