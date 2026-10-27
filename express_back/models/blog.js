const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Blog = sequelize.define('blog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: 'id'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '日志正文'
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
      comment: '创建者'
    }
  }, {
    tableName: 'blog',
    timestamps: false
  });

  Blog.associate = (models) => {
    Blog.hasMany(models.Photo, { foreignKey: 'blog_id', as: 'photos' });
  };

  return Blog;
};