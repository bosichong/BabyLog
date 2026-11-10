const request = require('supertest');
const babyRouter = require('../routes/baby');
const { auth, createApiTestContext } = require('./helpers/api-test-context');

describe('Baby API', () => {
  let context;

  beforeAll(async () => {
    context = await createApiTestContext(babyRouter, '/v1/babies', {
      createBaby: true,
    });
  });

  afterAll(async () => {
    await context.sequelize.close();
  });

  it('lists babies', async () => {
    const res = await request(context.app)
      .get('/v1/babies')
      .set(auth(context.token));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe('测试宝宝');
  });

  it('returns the blog count for a baby', async () => {
    const blog = await context.models.Blog.create({
      content: '宝宝日志统计',
      user_id: context.user.id,
    });
    await blog.setBabies([context.baby]);

    const res = await request(context.app)
      .get(`/v1/babies/${context.baby.id}/blogs/count`)
      .set(auth(context.token));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'success',
      data: { count: 1 },
    });
  });

  it('gets a baby by id', async () => {
    const res = await request(context.app)
      .get(`/v1/babies/${context.baby.id}`)
      .set(auth(context.token));

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('测试宝宝');
    expect(res.body.data.healthies).toEqual([]);
  });

  it('returns 404 for an unknown baby', async () => {
    const res = await request(context.app)
      .get('/v1/babies/999999')
      .set(auth(context.token));

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      status: 'error',
      message: '婴儿信息不存在',
    });
  });

  it('creates a baby', async () => {
    const res = await request(context.app)
      .post('/v1/babies')
      .set(auth(context.token))
      .send({ name: '新宝宝', birthday: '2024-02-03' });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toMatchObject({ name: '新宝宝' });
  });

  it('updates a baby through the current action endpoint', async () => {
    const res = await request(context.app)
      .post(`/v1/babies/${context.baby.id}/update`)
      .set(auth(context.token))
      .send({ name: '更新宝宝', birthday: '2023-03-04' });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      name: '更新宝宝',
      birthday: '2023-03-04',
    });
  });

  it('rejects an invalid birthday', async () => {
    const res = await request(context.app)
      .post(`/v1/babies/${context.baby.id}/update`)
      .set(auth(context.token))
      .send({ name: '日期错误', birthday: 'not-a-date' });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      status: 'error',
      message: '无效的出生日期格式，请使用YYYY-MM-DD格式',
    });
  });

  it('deletes a baby through the current action endpoint', async () => {
    const baby = await context.models.Baby.create({
      name: '待删除宝宝',
      birthday: new Date('2024-01-01'),
    });

    const res = await request(context.app)
      .post(`/v1/babies/${baby.id}/delete`)
      .set(auth(context.token));

    expect(res.status).toBe(204);
    expect(await context.models.Baby.findByPk(baby.id)).toBeNull();
  });

  it('requires authentication', async () => {
    const res = await request(context.app).get('/v1/babies');

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      status: 'error',
      message: '未提供认证令牌',
    });
  });
});
