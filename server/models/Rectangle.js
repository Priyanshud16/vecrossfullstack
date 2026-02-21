const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Rectangle = sequelize.define('Rectangle', {
  rectId: {   // ✅ renamed from id
    type: DataTypes.STRING,
  },
  x: DataTypes.FLOAT,
  y: DataTypes.FLOAT,
  width: DataTypes.FLOAT,
  height: DataTypes.FLOAT,
  color: DataTypes.STRING,
}, {
  timestamps: true,
});

module.exports = Rectangle;