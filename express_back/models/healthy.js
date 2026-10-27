const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Healthy = sequelize.define('health_record', {
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
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '创建时间'
    },
    updated_at: {
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
    tableName: 'health_record',
    timestamps: false
  });

  return Healthy;
};