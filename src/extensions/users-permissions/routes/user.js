module.exports = {
  routes: [
    {
      method: 'DELETE',
      path: '/users/:id',
      handler: 'user.delete',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    // ... routes อื่นๆ ...
  ],
};
