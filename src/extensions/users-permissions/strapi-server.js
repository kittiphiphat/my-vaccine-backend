'use strict';

const path = require('path');


const adminLogHelper = require(path.join(process.cwd(), 'src', 'utils', 'adminLogHelper.js'));
const patientLogHelper = require(path.join(process.cwd(), 'src', 'utils', 'patientLogHelper.js'));

module.exports = (plugin) => {
  const originalRegister = plugin.controllers.auth.register;

  plugin.controllers.auth.register = async (ctx) => {
    try {
      // เรียก register เดิม
      await originalRegister(ctx);

      const { user, jwt } = ctx.response.body || {};
      if (!user || !jwt) {
        throw new Error('ไม่สามารถสร้างผู้ใช้ได้');
      }

      // ดึงข้อมูล user พร้อม role
      const userWithRole = await strapi.entityService.findOne(
        'plugin::users-permissions.user',
        user.id,
        {
          populate: { role: true },
          select: ['id', 'username', 'email', 'confirmed', 'createdAt'],
        }
      );

      ctx.response.body = {
        jwt,
        user: {
          ...user,
          role: userWithRole.role,
        },
      };


      const isAdmin = userWithRole?.role?.name?.toLowerCase() === 'admin';
      const logHelper = isAdmin ? adminLogHelper : patientLogHelper;

      await logHelper({
        action: 'register_success',
        type: 'register',
        message: `สมัครสมาชิกสำเร็จ: ${userWithRole.username}`,
        user: {
          id: userWithRole.id,
          username: userWithRole.username,
          email: userWithRole.email,
          role: userWithRole.role?.name || 'Authenticated',
          confirmed: userWithRole.confirmed,
          createdAt: userWithRole.createdAt,
        },
        details: { ip: ctx.ip },
      });

    } catch (error) {
      console.error('Register override error:', error);

      // ตั้ง error response
      ctx.status = error.status || 400;
      ctx.body = {
        statusCode: ctx.status,
        error: 'Bad Request',
        message: error.message || 'ไม่สามารถสมัครสมาชิกได้',
      };

      // Log ล้มเหลว
      const { username, email } = ctx.request.body || {};
      await patientLogHelper({
        action: 'register_failed',
        type: 'register',
        message: `สมัครสมาชิกไม่สำเร็จ: ${error.message}`,
        user: null,
        details: {
          ip: ctx.ip,
          payload: { username, email },
          error: error.message,
        },
      });
    }
  };

  const originalCallback = plugin.controllers.auth.callback;

  plugin.controllers.auth.callback = async (ctx) => {
    try {
      await originalCallback(ctx);
      const { user } = ctx.response.body || {};
      if (!user) return;

      const userWithDetails = await strapi.entityService.findOne(
        'plugin::users-permissions.user',
        user.id,
        {
          populate: { role: true },
          select: ['id', 'username', 'email', 'confirmed', 'createdAt'],
        }
      );

      const isAdmin = userWithDetails?.role?.name?.toLowerCase() === 'admin';
      const logHelper = isAdmin ? adminLogHelper : patientLogHelper;

      // ตรวจสอบ confirmed
      if (!userWithDetails?.confirmed) {
        delete ctx.response.body.jwt;
        ctx.status = 403;
        ctx.body = {
          statusCode: 403,
          error: 'Forbidden',
          message: 'ไม่สามารถล็อกอินได้ กรุณาติดต่อเจ้าหน้าที่',
        };

        await logHelper({
          action: 'login_failed_unconfirmed',
          type: 'login',
          message: `บัญชีไม่ได้รับการยืนยัน: ${userWithDetails.username}`,
          user: {
            id: userWithDetails.id,
            username: userWithDetails.username,
            email: userWithDetails.email,
            role: userWithDetails.role?.name || null,
            confirmed: false,
          },
          details: { ip: ctx.ip },
        });
        return;
      }

      // ส่ง role กลับ
      ctx.response.body.user = { ...user, role: userWithDetails.role };

      await logHelper({
        action: 'login_success',
        type: 'login',
        message: `ล็อกอินสำเร็จ: ${userWithDetails.username}`,
        user: {
          id: userWithDetails.id,
          username: userWithDetails.username,
          email: userWithDetails.email,
          role: userWithDetails.role?.name || null,
          confirmed: true,
        },
        details: { ip: ctx.ip },
      });

    } catch (error) {
      console.error('Login override error:', error);
      ctx.status = 500;
      ctx.body = { message: 'เกิดข้อผิดพลาดในการล็อกอิน' };
    }
  };

  if (plugin.controllers.auth.logout) {
    const originalLogout = plugin.controllers.auth.logout;

    plugin.controllers.auth.logout = async (ctx) => {
      const user = ctx.state.user;
      try {
        await originalLogout(ctx);

        if (!user) return;

        const userWithDetails = await strapi.entityService.findOne(
          'plugin::users-permissions.user',
          user.id,
          {
            populate: { role: true },
            select: ['id', 'username', 'email'],
          }
        );

        const isAdmin = userWithDetails?.role?.name?.toLowerCase() === 'admin';
        const logHelper = isAdmin ? adminLogHelper : patientLogHelper;

        await logHelper({
          action: 'logout_success',
          type: 'logout',
          message: `ออกจากระบบ: ${userWithDetails.username}`,
          user: {
            id: userWithDetails.id,
            username: userWithDetails.username,
            email: userWithDetails.email,
            role: userWithDetails.role?.name || null,
          },
          details: { ip: ctx.ip },
        });

      } catch (error) {
        console.error('Logout override error:', error);
      }
    };
  }

  return plugin;
};
