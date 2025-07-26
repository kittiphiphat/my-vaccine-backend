'use strict';

const adminLogHelper = require('../../../utils/adminLogHelper');
const patientLogHelper = require('../../../utils/patientLogHelper');

module.exports = {
  async login(ctx) {
    const { identifier, password } = ctx.request.body;

    if (!identifier || !password) {
      return ctx.badRequest('Missing identifier or password');
    }

    const jwtService = strapi.plugin('users-permissions').service('jwt');

    const user = await strapi.query('plugin::users-permissions.user').findOne({
      where: {
        $or: [{ username: identifier }, { email: identifier }],
      },
      populate: ['role'],
    });

    if (!user) {
      return ctx.unauthorized('Invalid credentials');
    }

    const validPassword = await strapi
      .plugin('users-permissions')
      .service('user')
      .validatePassword(password, user.password);

    if (!validPassword) {
      return ctx.unauthorized('Invalid credentials');
    }

    const token = await jwtService.issue({ id: user.id });

    ctx.cookies.set('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    // Logging
    const roleName = user.role?.name?.toLowerCase() || '';
    const logDetails = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: roleName,
    };

    try {
      if (roleName === 'admin') {
        await adminLogHelper({
          action: 'login',
          type: 'login',
          message: `ผู้ดูแลระบบ ${user.username} ทำการล็อกอิน`,
          user: { id: user.id },
          details: logDetails,
        });
      } else if (roleName === 'patient') {
        await patientLogHelper({
          action: 'login',
          type: 'login',
          message: `ผู้ป่วย ${user.username} ทำการล็อกอิน`,
          user: { id: user.id },
          details: logDetails,
        });
      } else {
        await adminLogHelper({
          action: 'login',
          type: 'login',
          message: `ผู้ใช้ ${user.username} (role: ${roleName}) ทำการล็อกอิน`,
          user: { id: user.id },
          details: logDetails,
        });
      }
    } catch (err) {
      strapi.log.error('Login log error:', err);
    }

    ctx.body = {
      message: 'Logged in successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  },

  async logout(ctx) {
    const token = ctx.cookies.get('jwt');
    let user = null;

    if (token) {
      try {
        const decoded = await strapi.plugin('users-permissions').service('jwt').verify(token);
        user = await strapi.entityService.findOne('plugin::users-permissions.user', decoded.id, {
          populate: ['role'],
        });
      } catch (err) {

      }
    }

    ctx.cookies.set('jwt', null, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    try {
      if (user) {
        const roleName = user.role?.name?.toLowerCase() || '';
        const logDetails = {
          userId: user.id,
          username: user.username,
          email: user.email,
          role: roleName,
        };

        if (roleName === 'admin') {
          await adminLogHelper({
            action: 'logout',
            type: 'logout',
            message: `ผู้ดูแลระบบ ${user.username} ออกจากระบบ`,
            user: { id: user.id },
            details: logDetails,
          });
        } else if (roleName === 'patient') {
          await patientLogHelper({
            action: 'logout',
            type: 'logout',
            message: `ผู้ป่วย ${user.username} ออกจากระบบ`,
            user: { id: user.id },
            details: logDetails,
          });
        } else {
          await adminLogHelper({
            action: 'logout',
            type: 'logout',
            message: `ผู้ใช้ ${user.username} (role: ${roleName}) ออกจากระบบ`,
            user: { id: user.id },
            details: logDetails,
          });
        }
      } else {
        await adminLogHelper({
          action: 'logout',
          type: 'logout',
          message: 'ไม่สามารถระบุผู้ใช้ที่ออกระบบได้',
          details: { reason: 'token invalid or expired' },
        });
      }
    } catch (err) {
      strapi.log.error('Logout log error:', err);
    }

    ctx.body = {
      message: 'Logged out successfully',
    };
  },
};
