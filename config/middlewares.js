module.exports = [
  'strapi::errors',
  {
    name: 'strapi::cors',
    config: {
      origin: ['http://localhost:3000'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization', 'Cookie'],
      credentials: true,
    },
  },
  'strapi::security',
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',

  // **สำคัญ: ให้ middleware ดึง JWT อยู่ก่อน public และ permission**
  {
  name: 'global::jwtFromCookie'
},


  'strapi::favicon',
  'strapi::public',  // permission middleware อยู่ในนี้
];
