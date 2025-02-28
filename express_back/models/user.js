const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('user', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '用户ID'
    },
    username: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true,
      comment: '用户昵称'
    },
    hashed_password: {
      type: DataTypes.STRING(128),
      allowNull: false,
      comment: '用户密码'
    },
    familymember: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '家庭成员称呼'
    },
    sex: {
      type: DataTypes.STRING(2),
      allowNull: false,
      defaultValue: '男',
      comment: '用户性别'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '用户状态，默认停用'
    },
    avatar: {
      type: DataTypes.STRING(128),
      comment: '用户头像'
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
    }
  }, {
    tableName: 'user',
    timestamps: true,
    createdAt: 'create_time',
    updatedAt: 'update_time'
  });

  return User;
};