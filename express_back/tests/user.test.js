const request = require('supertest');
const userRouter = require('../routes/user');
const { auth, createApiTestContext } = require('./helpers/api-test-context');

describe('User API', () => {
  let context;

  beforeAll(async () => {
    context = await createApiTestContext(userRouter, '/v1/users');
  });

  afterAll(async () => {
    await context.sequelize.close();
  });

  it('lists users without password hashes', async () => {
    const res = await request(context.app)
      .get('/v1/users')
      .set(auth(context.token));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].username).toBe(context.user.username);
    expect(res.body.data[0]).not.toHaveProperty('hashed_password');
  });

  it('gets a user by id', async () => {
    const res = await request(context.app)
      .get(`/v1/users/${context.user.id}`)
      .set(auth(context.token));

    expect(res.status).toBe(200);
    expect(res.body.data.username).toBe(context.user.username);
    expect(res.body.data).not.toHaveProperty('hashed_password');
  });

  it('returns 404 for an unknown user', async () => {
    const res = await request(context.app)
      .get('/v1/users/999999')
      .set(auth(context.token));

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      status: 'error',
      message: '用户不存在',
    });
  });

  it('creates a user', async () => {
    const res = await request(context.app)
      .post('/v1/users')
      .set(auth(context.token))
      .send({
        username: 'createduser',
        password: 'createdpass',
        family_member: '新成员',
        gender: 'female',
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      username: 'createduser',
      family_member: '新成员',
      gender: 'female',
      is_active: true,
    });
    expect(res.body.data).not.toHaveProperty('hashed_password');
  });

  it('updates a user through the current action endpoint', async () => {
    const res = await request(context.app)
      .post(`/v1/users/${context.user.id}/update`)
      .set(auth(context.token))
      .send({
        family_member: '更新成员',
        gender: 'female',
        is_active: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      family_member: '更新成员',
      gender: 'female',
      is_active: true,
    });
  });

  it('deletes a user through the current action endpoint', async () => {
    const user = await context.models.User.create({
      username: 'deleteuser',
      hashed_password: context.user.hashed_password,
      family_member: '待删除成员',
      gender: 'male',
      is_active: true,
    });

    const res = await request(context.app)
      .post(`/v1/users/${user.id}/delete`)
      .set(auth(context.token));

    expect(res.status).toBe(204);
    expect(await context.models.User.findByPk(user.id)).toBeNull();
  });

  it('requires authentication', async () => {
    const res = await request(context.app).get('/v1/users');

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });
});
