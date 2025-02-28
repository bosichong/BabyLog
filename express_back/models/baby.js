const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Baby = sequelize.define('baby', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: 'id'
    },
    name: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true,
      comment: '孩子的名称'
    },
    birthday: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: '生日'
    }
  }, {
    tableName: 'baby',
    timestamps: false
  });

  return Baby;
};