const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const BlogBaby = sequelize.define('blog_baby', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    blog_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '博客ID'
    },
    baby_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '宝宝ID'
    }
  }, {
    tableName: 'blog_baby',
    timestamps: false
  });

  return BlogBaby;
};