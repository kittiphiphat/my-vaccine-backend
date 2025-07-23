module.exports = {
  async afterCreate(event) {
    const newVaccine = event.result;
    if (strapi.io) {
      strapi.io.emit('vaccine:created', newVaccine);
    }
  },
  async afterUpdate(event) {
    const updatedVaccine = event.result;
    if (strapi.io) {
      strapi.io.emit('vaccine:updated', updatedVaccine);
    }
  },
  async afterDelete(event) {
    const deletedVaccine = event.result;
    if (strapi.io) {
      strapi.io.emit('vaccine:deleted', deletedVaccine);
    }
  },
};
