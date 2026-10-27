const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Video = sequelize.define('video', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '视频ID'
    },
    file_name: {
      type: DataTypes.STRING(256),
      allowNull: false,
      comment: '转码后的文件名'
    },
    storage_path: {
      type: DataTypes.STRING(256),
      allowNull: false,
      comment: '视频服务器相对路径，如 videos/2026/xxx.mp4'
    },
    file_url: {
      type: DataTypes.STRING(256),
      allowNull: false,
      comment: '视频网络地址'
    },
    duration: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: '视频时长（秒）'
    },
    size_bytes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '文件大小（字节）'
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
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '上传者',
      references: {
        model: 'user',
        key: 'id'
      }
    },
    blog_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '归属日志（一篇日志最多一个视频）',
      references: {
        model: 'blog',
        key: 'id'
      }
    }
  }, {
    tableName: 'video',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: 'video_user_id',
        using: 'BTREE',
        fields: [{ name: 'user_id' }]
      },
      {
        name: 'video_blog_id_unique',
        unique: true,
        using: 'BTREE',
        fields: [{ name: 'blog_id' }]
      }
    ]
  });

  return Video;
};
