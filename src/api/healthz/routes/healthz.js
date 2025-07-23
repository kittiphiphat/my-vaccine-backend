'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/healthz',
      handler: 'healthz.index',
      config: {
        auth: false,
      },
    },
  ],
};
