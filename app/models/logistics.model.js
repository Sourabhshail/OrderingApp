module.exports = (sequelize, Sequelize) => {
    const Logistics = sequelize.define('Logistics', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        orderId: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        city: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        address: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        pin: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        status: {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 'Processing', // Default value for status
        },
    }, {
        // Optional: You can define additional options for the model here
        timestamps: true, // This will add createdAt and updatedAt fields
    });
    return Logistics;
};