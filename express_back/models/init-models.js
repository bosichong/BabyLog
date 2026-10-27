function initModels(sequelize) {
  const User = require('./user')(sequelize);
  const Baby = require('./baby')(sequelize);
  const Blog = require('./blog')(sequelize);
  const Healthy = require('./healthy')(sequelize);
  const BlogBaby = require('./blog_baby')(sequelize);
  const Photo = require('./photo')(sequelize);
  const Video = require('./video')(sequelize);

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

  // 博客和视频的一对一关系（一篇日志最多一个视频）
  Blog.hasOne(Video, { foreignKey: 'blog_id', as: 'video' });
  Video.belongsTo(Blog, { foreignKey: 'blog_id', as: 'blog' });

  // 用户和视频的一对多关系
  User.hasMany(Video, { foreignKey: 'user_id' });
  Video.belongsTo(User, { foreignKey: 'user_id' });

  return {
    User,
    Baby,
    Blog,
    Healthy,
    BlogBaby,
    Photo,
    Video
  };
}

module.exports = initModels;