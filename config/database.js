module.exports = ({ env }) => ({
  connection: {
    client: 'mysql2',
    connection: {
      host: env('DATABASE_HOST', 'mysql'),
      port: env.int('DATABASE_PORT', 3307),
      database: env('DATABASE_NAME', 'hospital_vaccine_db'),
      user: env('DATABASE_USERNAME', 'hospital_admin'),
      password: env('DATABASE_PASSWORD', '0MedxCmU'),
      ssl: env.bool('DATABASE_SSL', false),
      timezone: '+07:00',
    },
  },
});
