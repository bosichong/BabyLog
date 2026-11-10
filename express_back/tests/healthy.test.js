const request = require('supertest');
const healthyRouter = require('../routes/healthy');
const { auth, createApiTestContext } = require('./helpers/api-test-context');

describe('Healthy API', () => {
  let context;

  beforeAll(async () => {
    context = await createApiTestContext(healthyRouter, '/v1/healthies', {
      createBaby: true,
    });
  });

  afterAll(async () => {
    await context.sequelize.close();
  });

  it('lists health records', async () => {
    await context.models.Healthy.create({
      height: 50,
      weight: 3.5,
      baby_id: context.baby.id,
    });

    const res = await request(context.app)
      .get('/v1/healthies')
      .set(auth(context.token));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].Baby.name).toBe(context.baby.name);
  });

  it('gets a health record by id', async () => {
    const healthy = await context.models.Healthy.create({
      height: 61,
      weight: 6.1,
      baby_id: context.baby.id,
    });

    const res = await request(context.app)
      .get(`/v1/healthies/${healthy.id}`)
      .set(auth(context.token));

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ height: 61, weight: 6.1 });
    expect(res.body.data.Baby.name).toBe(context.baby.name);
  });

  it('lists records for a specific baby', async () => {
    const res = await request(context.app)
      .get(`/v1/healthies/babies/${context.baby.id}`)
      .set(auth(context.token));

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data.every((item) => item.baby_id === context.baby.id)).toBe(true);
  });

  it('returns 404 for an unknown health record', async () => {
    const res = await request(context.app)
      .get('/v1/healthies/999999')
      .set(auth(context.token));

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      status: 'error',
      message: '健康记录不存在',
    });
  });

  it('creates a health record', async () => {
    const res = await request(context.app)
      .post('/v1/healthies')
      .set(auth(context.token))
      .send({ height: 72, weight: 8.2, baby_id: context.baby.id });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ height: 72, weight: 8.2 });
    expect(res.body.data.Baby.name).toBe(context.baby.name);
  });

  it('updates a health record through the current action endpoint', async () => {
    const healthy = await context.models.Healthy.create({
      height: 75,
      weight: 9,
      baby_id: context.baby.id,
    });

    const res = await request(context.app)
      .post(`/v1/healthies/${healthy.id}/update`)
      .set(auth(context.token))
      .send({ height: 76, weight: 9.1 });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ height: 76, weight: 9.1 });
  });

  it('deletes a health record through the current action endpoint', async () => {
    const healthy = await context.models.Healthy.create({
      height: 80,
      weight: 10,
      baby_id: context.baby.id,
    });

    const res = await request(context.app)
      .post(`/v1/healthies/${healthy.id}/delete`)
      .set(auth(context.token));

    expect(res.status).toBe(204);
    expect(await context.models.Healthy.findByPk(healthy.id)).toBeNull();
  });

  it('requires authentication', async () => {
    const res = await request(context.app).get('/v1/healthies');

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });
});
