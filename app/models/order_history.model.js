module.exports = (sequelize, Sequelize) => {
    const Order = sequelize.define('Order', {
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
        quantity: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        totalCost: {
            type: Sequelize.FLOAT,
            allowNull: false,
        },
        perItemCost: {
            type: Sequelize.FLOAT,
            allowNull: false,
        },
        shippingCharges: {
            type: Sequelize.FLOAT,
            allowNull: false,
        },
        estimatedDeliveryDate: {
            type: Sequelize.DATE,
            allowNull: true,
        },
        deliveryType: {
            type: Sequelize.STRING,
            allowNull: true,
        },
    }, {
        // Optional: You can define additional options for the model here
        timestamps: true, // This will add createdAt and updatedAt fields
    });
    return Order;
};