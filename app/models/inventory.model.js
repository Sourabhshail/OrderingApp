module.exports = (sequelize, Sequelize) => {
  const Inventory = sequelize.define('Inventory', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    orderId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    itemId: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    quantityAvailable: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
  }, {
    // Optional: You can define additional options for the model here
    timestamps: true, // This will add createdAt and updatedAt fields
  });
  return Inventory;
};