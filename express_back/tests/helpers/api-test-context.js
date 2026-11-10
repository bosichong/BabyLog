const express = require('express');
const { Sequelize } = require('sequelize');
const initModels = require('../../models/init-models');
const { generateToken, hashPassword } = require('../../middleware/auth');

async function createApiTestContext(router, mountPath, options = {}) {
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
  });
  const models = initModels(sequelize);

  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use((req, res, next) => {
    req.models = models;
    next();
  });
  app.use(mountPath, router);

  await sequelize.sync({ force: true });

  const password = 'testpass123';
  const user = await models.User.create({
    username: options.username || 'testuser',
    hashed_password: await hashPassword(password),
    family_member: '测试成员',
    gender: 'male',
    is_active: true,
  });

  let baby = null;
  if (options.createBaby) {
    baby = await models.Baby.create({
      name: options.babyName || '测试宝宝',
      birthday: new Date('2023-01-01'),
    });
  }

  return {
    app,
    sequelize,
    models,
    user,
    baby,
    password,
    token: generateToken(user.username),
  };
}

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

module.exports = {
  auth,
  createApiTestContext,
};
