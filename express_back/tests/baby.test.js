const request = require('supertest');
const express = require('express');
const { Sequelize } = require('sequelize');
const initModels = require('../models/init-models');
const babyRouter = require('../routes/baby');
const { generateToken } = require('../middleware/auth');

describe('Baby API Tests', () => {
    let app;
    let sequelize;
    let models;
    let testToken;

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

        app.use('/', babyRouter);

        // 同步数据库并创建测试用户和婴儿
        await sequelize.sync({ force: true });

        // 创建测试用户
        await models.User.create({
            username: 'testuser',
            hashed_password: 'testpassword',
            familymember: '测试用户',
            sex: '1',
            is_active: true
        });

        // 创建测试婴儿
        await models.Baby.create({
            name: '测试宝宝',
            birthday: new Date('2023-01-01')
        });

        // 生成测试用token
        testToken = generateToken('testuser');
    });

    afterAll(async () => {
        await sequelize.close();
    });

    describe('GET /babies', () => {
        it('should return all babies', async () => {
            const res = await request(app)
                .get('/babies')
                .set('Authorization', `Bearer ${testToken}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBeTruthy();
            expect(res.body.length).toBe(1);
            expect(res.body[0]).toHaveProperty('name', '测试宝宝');
        });

        it('should return 401 without token', async () => {
            const res = await request(app).get('/babies');
            expect(res.status).toBe(401);
        });
    });

    describe('GET /babies/:id', () => {
        it('should return baby by id', async () => {
            const res = await request(app)
                .get('/babies/1')
                .set('Authorization', `Bearer ${testToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('name', '测试宝宝');
            expect(res.body).toHaveProperty('birthday');
        });

        it('should return 404 for non-existent baby', async () => {
            const res = await request(app)
                .get('/babies/999')
                .set('Authorization', `Bearer ${testToken}`);

            expect(res.status).toBe(404);
        });
    });

    describe('POST /babies', () => {
        it('should create new baby', async () => {
            const babyData = {
                name: '新宝宝',
                birthday: '2024-01-01'
            };

            const res = await request(app)
                .post('/babies')
                .set('Authorization', `Bearer ${testToken}`)
                .send(babyData);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('name', '新宝宝');
            expect(res.body).toHaveProperty('birthday');
        });
    });

    describe('PUT /babies/:id', () => {
        it('should update baby', async () => {
            const updateData = {
                name: '更新宝宝',
                birthday: '2024-02-01'
            };

            const res = await request(app)
                .put('/babies/1')
                .set('Authorization', `Bearer ${testToken}`)
                .send(updateData);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('name', '更新宝宝');
        });

        it('should return 404 for non-existent baby', async () => {
            const res = await request(app)
                .put('/babies/999')
                .set('Authorization', `Bearer ${testToken}`)
                .send({ name: '测试' });

            expect(res.status).toBe(404);
        });
    });

    describe('DELETE /babies/:id', () => {
        it('should delete baby', async () => {
            const res = await request(app)
                .delete('/babies/1')
                .set('Authorization', `Bearer ${testToken}`);

            expect(res.status).toBe(204);

            // 验证婴儿信息已被删除
            const checkRes = await request(app)
                .get('/babies/1')
                .set('Authorization', `Bearer ${testToken}`);
            expect(checkRes.status).toBe(404);
        });

        it('should return 404 for non-existent baby', async () => {
            const res = await request(app)
                .delete('/babies/999')
                .set('Authorization', `Bearer ${testToken}`);

            expect(res.status).toBe(404);
        });
    });
});