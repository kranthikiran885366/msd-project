const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/postgres');

const AdminSettings = sequelize.define('AdminSettings', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  siteName: DataTypes.STRING,
  maintenanceMode: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  allowRegistration: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  settings: DataTypes.JSONB
});

module.exports = AdminSettings;