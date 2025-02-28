const { Sequelize } = require('sequelize');
const initModels = require('../models/init-models');

describe('Database Models Tests', () => {
  let sequelize;
  let models;
  let user;
  let baby;
  let blog;
  let healthy;

  beforeAll(async () => {
    // 设置测试数据库
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: ':memory:',
      logging: false
    });
    models = initModels(sequelize);

    // 连接并同步数据库
    await sequelize.authenticate();
    await sequelize.sync({ force: true });

    // 创建测试数据
    user = await models.User.create({
      username: 'testuser',
      hashed_password: 'testpassword',
      familymember: '测试成员',
      sex: '1',
      is_active: true
    });

    baby = await models.Baby.create({
      name: '测试宝宝',
      birthday: new Date()
    });

    blog = await models.Blog.create({
      blog: '这是一条测试博客内容',
      user_id: user.id
    });

    await models.BlogBaby.create({
      blog_id: blog.id,
      baby_id: baby.id
    });

    healthy = await models.Healthy.create({
      height: 50,
      weight: 3000,
      baby_id: baby.id
    });
  });

  afterAll(async () => {
    // 清理测试数据
    await models.Healthy.destroy({ where: { id: healthy.id } });
    await models.BlogBaby.destroy({ where: { blog_id: blog.id } });
    await models.Blog.destroy({ where: { id: blog.id } });
    await models.Baby.destroy({ where: { id: baby.id } });
    await models.User.destroy({ where: { id: user.id } });
    await sequelize.close();
  });

  describe('User-Blog Association', () => {
    it('should correctly associate user with blogs', async () => {
      const userWithBlogs = await models.User.findOne({
        where: { id: user.id },
        include: [models.Blog]
      });
      expect(userWithBlogs.blogs).toBeDefined();
      expect(userWithBlogs.blogs.length).toBeGreaterThan(0);
      expect(userWithBlogs.blogs[0].blog).toBe('这是一条测试博客内容');
    });
  });

  describe('Blog-Baby Association', () => {
    it('should correctly associate blog with babies', async () => {
      const blogWithBabies = await models.Blog.findOne({
        where: { id: blog.id },
        include: [models.Baby]
      });
      expect(blogWithBabies.babies).toBeDefined();
      expect(blogWithBabies.babies.length).toBeGreaterThan(0);
      expect(blogWithBabies.babies[0].name).toBe('测试宝宝');
    });
  });

  describe('Baby-Healthy Association', () => {
    it('should correctly associate baby with health records', async () => {
      const babyWithHealthy = await models.Baby.findOne({
        where: { id: baby.id },
        include: [{ model: models.Healthy, as: 'healthies' }]
      });
      expect(babyWithHealthy.healthies).toBeDefined();
      expect(babyWithHealthy.healthies.length).toBeGreaterThan(0);
      expect(babyWithHealthy.healthies[0].height).toBe(50);
      expect(babyWithHealthy.healthies[0].weight).toBe(3000);
    });
  });
});