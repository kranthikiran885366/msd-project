const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MFAConfig = sequelize.define('MFAConfig', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('totp', 'sms', 'email'),
    allowNull: false
  },
  secret: {
    type: DataTypes.STRING,
    allowNull: true // TOTP secret
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true // For SMS
  },
  backupCodes: {
    type: DataTypes.JSON,
    defaultValue: [] // Array of hashed backup codes
  },
  isEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  lastUsed: {
    type: DataTypes.DATE,
    allowNull: true
  }
});

module.exports = MFAConfig;