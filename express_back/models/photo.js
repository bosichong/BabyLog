const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('photo', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    file_name: {
      type: DataTypes.STRING(256),
      allowNull: false,
      comment: '文件名称'
    },
    file_path: {
      type: DataTypes.STRING(256),
      allowNull: false,
      comment: '相片服务器地址'
    },
    file_url: {
      type: DataTypes.STRING(256),
      allowNull: false,
      comment: '相片网络地址'
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '创建者',
      references: {
        model: 'user',
        key: 'id'
      }
    },
    blog_id: {
      type: DataTypes.INTEGER,
      allowNull: true,  // 修改为允许为null，因为照片可能在创建时还未关联到博客
      comment: '归属于哪条blog',
      references: {
        model: 'blog',
        key: 'id'
      }
    }
  }, {
    sequelize,
    tableName: 'photo',
    timestamps: false,
    indexes: [
      {
        name: 'PRIMARY',
        unique: true,
        using: 'BTREE',
        fields: [
          { name: 'id' },
        ]
      },
      {
        name: 'user_id',
        using: 'BTREE',
        fields: [
          { name: 'user_id' },
        ]
      },
      {
        name: 'blog_id',
        using: 'BTREE',
        fields: [
          { name: 'blog_id' },
        ]
      },
    ]
  });
};