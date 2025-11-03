const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PasswordPolicy = sequelize.define('PasswordPolicy', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Organizations',
      key: 'id'
    }
  },
  minLength: {
    type: DataTypes.INTEGER,
    defaultValue: 8
  },
  requireUppercase: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  requireLowercase: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  requireNumbers: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  requireSpecialChars: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  passwordHistory: {
    type: DataTypes.INTEGER,
    defaultValue: 3 // Number of previous passwords to remember
  },
  maxAge: {
    type: DataTypes.INTEGER,
    defaultValue: 90 // Days before password expires
  },
  lockoutThreshold: {
    type: DataTypes.INTEGER,
    defaultValue: 5 // Failed attempts before lockout
  },
  lockoutDuration: {
    type: DataTypes.INTEGER,
    defaultValue: 15 // Minutes of lockout
  }
});

module.exports = PasswordPolicy;