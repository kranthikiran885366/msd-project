const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/postgres');

const HelpArticle = sequelize.define('HelpArticle', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  category: DataTypes.STRING,
  published: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

module.exports = HelpArticle;