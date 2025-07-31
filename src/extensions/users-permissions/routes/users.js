module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/user/me',
      handler: 'users.me',
      config: {
        auth: false,
      },
    },

  ],
};
