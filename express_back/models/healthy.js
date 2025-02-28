const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Healthy = sequelize.define('healthy', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '身高体重数据ID'
    },
    height: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '身高'
    },
    weight: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '体重'
    },
    create_time: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '创建时间'
    },
    update_time: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '更新时间'
    },
    baby_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'baby'
    }
  }, {
    tableName: 'healthy',
    timestamps: false
  });

  return Healthy;
};