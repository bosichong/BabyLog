const request = require('supertest');
const authRouter = require('../routes/auth');
const { createApiTestContext } = require('./helpers/api-test-context');

describe('Auth API', () => {
  let context;

  beforeAll(async () => {
    context = await createApiTestContext(authRouter, '/v1/auth');
  });

  afterAll(async () => {
    await context.sequelize.close();
  });

  it('logs in with valid credentials', async () => {
    const res = await request(context.app)
      .post('/v1/auth/token')
      .send({ username: context.user.username, password: context.password });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toMatchObject({ token_type: 'bearer' });
    expect(res.body.data.access_token).toBeTruthy();
  });

  it('rejects a wrong password', async () => {
    const res = await request(context.app)
      .post('/v1/auth/token')
      .send({ username: context.user.username, password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      status: 'error',
      message: '密码错误',
      error: 'INVALID_PASSWORD',
    });
  });

  it('rejects a disabled user', async () => {
    const disabledUser = await context.models.User.create({
      username: 'disableduser',
      hashed_password: context.user.hashed_password,
      family_member: '停用成员',
      gender: 'female',
      is_active: false,
    });

    const res = await request(context.app)
      .post('/v1/auth/token')
      .send({ username: disabledUser.username, password: context.password });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      status: 'error',
      message: '账户已被禁用',
      error: 'ACCOUNT_DISABLED',
    });
  });

  it('registers a pending user', async () => {
    const res = await request(context.app)
      .post('/v1/auth/register')
      .send({
        username: 'newuser',
        password: 'newpass123',
        family_member: '新成员',
        gender: 'female',
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('注册成功，请等待管理员审核激活');
    expect(res.body.data).toMatchObject({
      username: 'newuser',
      family_member: '新成员',
      is_active: false,
    });
    expect(res.body.data).not.toHaveProperty('hashed_password');
  });

  it('rejects a duplicate username', async () => {
    const res = await request(context.app)
      .post('/v1/auth/register')
      .send({
        username: context.user.username,
        password: 'anotherpass',
        family_member: '重复成员',
        gender: 'male',
      });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      status: 'error',
      message: '用户名已存在',
    });
  });
});
