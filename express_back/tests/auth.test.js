const { authenticateUser, generateToken, hashPassword } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'ededcbe81f2e015697780d536196c0baa6ea26021ad7070867e40b18a51ff8da';
const { Sequelize } = require('sequelize');
const initModels = require('../models/init-models');

describe('Authentication Tests', () => {
  let sequelize;
  let models;

  beforeAll(async () => {
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: ':memory:',
      logging: false
    });
    models = initModels(sequelize);
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('User Authentication', () => {
    let normalUsername;
    let normalPassword;
    let normalUser;

    beforeEach(async () => {
      normalUsername = 'testuser_' + Date.now();
      normalPassword = 'testpass123';
      const hashedPassword = await hashPassword(normalPassword);

      normalUser = await models.User.create({
        username: normalUsername,
        hashed_password: hashedPassword,
        familymember: '测试用户',
        sex: '男',
        is_active: true
      });
    });

    afterEach(async () => {
      await models.User.destroy({ where: { username: normalUsername } });
    });

    it('should authenticate normal user successfully', async () => {
      const authenticatedUser = await authenticateUser(models, normalUsername, normalPassword);
      expect(authenticatedUser).toBeTruthy();

      const token = generateToken(normalUsername);
      expect(token).toBeTruthy();

      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded.sub).toBe(normalUsername);
    });

    it('should reject login with wrong password', async () => {
      const authenticatedUser = await authenticateUser(models, normalUsername, 'wrongpass');
      expect(authenticatedUser).toBeFalsy();
    });

    it('should reject login for disabled user', async () => {
      const disabledUsername = 'disabled_user_' + Date.now();
      const disabledPassword = 'testpass456';
      const disabledHashedPassword = await hashPassword(disabledPassword);

      await models.User.create({
        username: disabledUsername,
        hashed_password: disabledHashedPassword,
        familymember: '禁用测试用户',
        sex: '男',
        is_active: false
      });

      const authenticatedUser = await authenticateUser(models, disabledUsername, disabledPassword);
      expect(authenticatedUser).toBeFalsy();

      await models.User.destroy({ where: { username: disabledUsername } });
    });
  });

  describe('Temporary Users', () => {
    const tempUsername1 = 'temp_user_1';
    const tempPassword1 = 'temp123';
    const tempUsername2 = 'temp_user_2';
    const tempPassword2 = 'temp456';

    beforeEach(async () => {
      await models.User.destroy({ where: { username: [tempUsername1, tempUsername2] } });
    });

    afterEach(async () => {
      await models.User.destroy({ where: { username: [tempUsername1, tempUsername2] } });
    });

    it('should authenticate temporary user successfully', async () => {
      const hashedPassword1 = await hashPassword(tempPassword1);
      await models.User.create({
        username: tempUsername1,
        hashed_password: hashedPassword1,
        familymember: '临时用户1',
        sex: '男',
        is_active: true
      });

      const authenticatedUser = await authenticateUser(models, tempUsername1, tempPassword1);
      expect(authenticatedUser).toBeTruthy();

      const token = generateToken(tempUsername1);
      expect(token).toBeTruthy();

      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded.sub).toBe(tempUsername1);
    });

    it('should reject login with wrong password for temporary user', async () => {
      const hashedPassword2 = await hashPassword(tempPassword2);
      await models.User.create({
        username: tempUsername2,
        hashed_password: hashedPassword2,
        familymember: '临时用户2',
        sex: '男',
        is_active: true
      });

      const authenticatedUser = await authenticateUser(models, tempUsername2, 'wrongpass');
      expect(authenticatedUser).toBeFalsy();
    });
  });
});