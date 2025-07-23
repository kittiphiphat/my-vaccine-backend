'use strict';

const dayjs = require('dayjs');

module.exports = {
  async beforeCreate(event) {
    const { data } = event.params;
    if (data.birth_date) {
      const age = calculateAge(data.birth_date);
      if (age !== null) {
        data.age = age;
      }
    }
  },

  async beforeUpdate(event) {
    const { data } = event.params;
    if (data.birth_date) {
      const age = calculateAge(data.birth_date);
      if (age !== null) {
        data.age = age;
      }
    }
  },
};

function calculateAge(birthDateStr) {
  const birthDate = dayjs(birthDateStr);
  if (!birthDate.isValid()) return null;
  const today = dayjs();
  return today.diff(birthDate, 'year');
}
