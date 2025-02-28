const request = require('supertest');
const express = require('express');
const { Sequelize } = require('sequelize');
const initModels = require('../models/init-models');
const healthyRouter = require('../routes/healthy');
const { generateToken } = require('../middleware/auth');

describe('Healthy API Tests', () => {
    let app;
    let sequelize;
    let models;
    let testToken;
    let testBaby;

    beforeAll(async () => {
        // 设置测试数据库
        sequelize = new Sequelize('sqlite::memory:', { logging: false });
        models = initModels(sequelize);

        // 创建Express应用
        app = express();
        app.use(express.json());

        // 添加models到请求对象
        app.use((req, res, next) => {
            req.models = models;
            next();
        });

        app.use('/', healthyRouter);

        // 同步数据库
        await sequelize.sync({ force: true });

        // 创建测试用户
        await models.User.create({
            username: 'testuser',
            hashed_password: 'testpassword',
            familymember: '测试成员',
            sex: '1',
            is_active: true
        });

        // 创建测试婴儿
        testBaby = await models.Baby.create({
            name: '测试宝宝',
            birthday: new Date('2023-01-01')
        });

        // 生成测试用token
        testToken = generateToken('testuser');
    });

    afterAll(async () => {
        await sequelize.close();
    });

    describe('GET /healthies', () => {
        it('should return all health records', async () => {
            // 创建测试健康记录
            await models.Healthy.create({
                height: 50,
                weight: 3.5,
                baby_id: testBaby.id
            });

            const res = await request(app)
                .get('/healthies')
                .set('Authorization', `Bearer ${testToken}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBeTruthy();
            expect(res.body.length).toBe(1);
            expect(res.body[0]).toHaveProperty('height', 50);
            expect(res.body[0]).toHaveProperty('weight', 3.5);
            expect(res.body[0].Baby).toHaveProperty('name', '测试宝宝');
        });

        it('should return 401 without token', async () => {
            const res = await request(app).get('/healthies');
            expect(res.status).toBe(401);
        });
    });

    describe('GET /healthies/:id', () => {
        it('should return health record by id', async () => {
            const healthy = await models.Healthy.create({
                height: 52,
                weight: 4.0,
                baby_id: testBaby.id
            });

            const res = await request(app)
                .get(`/healthies/${healthy.id}`)
                .set('Authorization', `Bearer ${testToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('height', 52);
            expect(res.body).toHaveProperty('weight', 4.0);
            expect(res.body.Baby).toHaveProperty('name', '测试宝宝');
        });

        it('should return 404 for non-existent health record', async () => {
            const res = await request(app)
                .get('/healthies/999')
                .set('Authorization', `Bearer ${testToken}`);

            expect(res.status).toBe(404);
        });
    });

    describe('GET /babies/:babyId/healthies', () => {
        it('should return health records for specific baby', async () => {
            const res = await request(app)
                .get(`/babies/${testBaby.id}/healthies`)
                .set('Authorization', `Bearer ${testToken}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBeTruthy();
            expect(res.body.length).toBeGreaterThan(0);
            expect(res.body[0].Baby).toHaveProperty('name', '测试宝宝');
        });
    });

    describe('POST /healthies', () => {
        it('should create new health record', async () => {
            const healthyData = {
                height: 55,
                weight: 4.5,
                baby_id: testBaby.id
            };

            const res = await request(app)
                .post('/healthies')
                .set('Authorization', `Bearer ${testToken}`)
                .send(healthyData);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('height', 55);
            expect(res.body).toHaveProperty('weight', 4.5);
            expect(res.body.Baby).toHaveProperty('name', '测试宝宝');
        });
    });

    describe('PUT /healthies/:id', () => {
        it('should update health record', async () => {
            const healthy = await models.Healthy.create({
                height: 56,
                weight: 4.8,
                baby_id: testBaby.id
            });

            const updateData = {
                height: 57,
                weight: 5.0
            };

            const res = await request(app)
                .put(`/healthies/${healthy.id}`)
                .set('Authorization', `Bearer ${testToken}`)
                .send(updateData);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('height', 57);
            expect(res.body).toHaveProperty('weight', 5.0);
            expect(res.body.Baby).toHaveProperty('name', '测试宝宝');
        });

        it('should return 404 for non-existent health record', async () => {
            const res = await request(app)
                .put('/healthies/999')
                .set('Authorization', `Bearer ${testToken}`)
                .send({ height: 60, weight: 5.5 });

            expect(res.status).toBe(404);
        });
    });

    describe('DELETE /healthies/:id', () => {
        it('should delete health record', async () => {
            const healthy = await models.Healthy.create({
                height: 58,
                weight: 5.2,
                baby_id: testBaby.id
            });

            const res = await request(app)
                .delete(`/healthies/${healthy.id}`)
                .set('Authorization', `Bearer ${testToken}`);

            expect(res.status).toBe(204);

            // 验证记录已被删除
            const checkRes = await request(app)
                .get(`/healthies/${healthy.id}`)
                .set('Authorization', `Bearer ${testToken}`);
            expect(checkRes.status).toBe(404);
        });

        it('should return 404 for non-existent health record', async () => {
            const res = await request(app)
                .delete('/healthies/999')
                .set('Authorization', `Bearer ${testToken}`);

            expect(res.status).toBe(404);
        });
    });
});