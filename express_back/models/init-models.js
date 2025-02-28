function initModels(sequelize) {
  const User = require('./user')(sequelize);
  const Baby = require('./baby')(sequelize);
  const Blog = require('./blog')(sequelize);
  const Healthy = require('./healthy')(sequelize);
  const BlogBaby = require('./blog_baby')(sequelize);
  const Photo = require('./photo')(sequelize);

  // 用户与博客的一对多关系
  User.hasMany(Blog, { foreignKey: 'user_id' });
  Blog.belongsTo(User, { foreignKey: 'user_id' });

  // 宝宝与健康数据的一对多关系
  Baby.hasMany(Healthy, { foreignKey: 'baby_id', as: 'healthies' });
  Healthy.belongsTo(Baby, { foreignKey: 'baby_id', as: 'Baby' });

  // 博客和宝宝的多对多关系
  Blog.belongsToMany(Baby, {
    through: BlogBaby,
    foreignKey: 'blog_id',
    otherKey: 'baby_id'
  });
  Baby.belongsToMany(Blog, {
    through: BlogBaby,
    foreignKey: 'baby_id',
    otherKey: 'blog_id'
  });

  // 博客和图片的一对多关系
  Blog.hasMany(Photo, { foreignKey: 'blog_id' });
  Photo.belongsTo(Blog, { foreignKey: 'blog_id' });

  return {
    User,
    Baby,
    Blog,
    Healthy,
    BlogBaby,
    Photo
  };
}

module.exports = initModels;