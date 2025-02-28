const request = require('supertest');
const express = require('express');
const { Sequelize } = require('sequelize');
const initModels = require('../models/init-models');
const userRouter = require('../routes/user');
const { generateToken } = require('../middleware/auth');

describe('User API Tests', () => {
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

        app.use('/', userRouter);

        // 同步数据库并创建测试用户
        await sequelize.sync({ force: true });
        await models.User.create({
            username: 'testuser',
            hashed_password: 'testpassword',
            familymember: '测试成员',
            sex: '男',
            is_active: true
        });

        // 生成测试用token
        testToken = generateToken('testuser');
    });

    afterAll(async () => {
        await sequelize.close();
    });

    describe('GET /users', () => {
        it('should return all users', async () => {
            const res = await request(app)
                .get('/users')
                .set('Authorization', `Bearer ${testToken}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBeTruthy();
            expect(res.body.length).toBe(1);
            expect(res.body[0]).toHaveProperty('username', 'testuser');
        });

        it('should return 401 without token', async () => {
            const res = await request(app).get('/users');
            expect(res.status).toBe(401);
        });
    });

    describe('GET /users/:id', () => {
        it('should return user by id', async () => {
            const res = await request(app)
                .get('/users/1')
                .set('Authorization', `Bearer ${testToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('username', 'testuser');
        });

        it('should return 404 for non-existent user', async () => {
            const res = await request(app)
                .get('/users/999')
                .set('Authorization', `Bearer ${testToken}`);

            expect(res.status).toBe(404);
        });
    });

    describe('POST /users', () => {
        it('should create new user', async () => {
            const userData = {
                username: 'newuser',
                password: 'newpassword',
                familymember: '新成员',
                sex: '女'
            };

            const res = await request(app)
                .post('/users')
                .send(userData);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('username', 'newuser');
            expect(res.body).toHaveProperty('familymember', '新成员');
            expect(res.body).not.toHaveProperty('hashed_password');
        });
    });

    describe('PUT /users/:id', () => {
        it('should update user', async () => {
            const updateData = {
                familymember: '更新成员',
                sex: '女',
                is_active: true
            };

            const res = await request(app)
                .put('/users/1')
                .set('Authorization', `Bearer ${testToken}`)
                .send(updateData);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('familymember', '更新成员');
            expect(res.body).toHaveProperty('sex', '女');
            expect(res.body).toHaveProperty('is_active', true);
        });

        it('should return 404 for non-existent user', async () => {
            const res = await request(app)
                .put('/users/999')
                .set('Authorization', `Bearer ${testToken}`)
                .send({ familymember: '测试' });

            expect(res.status).toBe(404);
        });
    });

    describe('DELETE /users/:id', () => {
        it('should delete user', async () => {
            const res = await request(app)
                .delete('/users/1')
                .set('Authorization', `Bearer ${testToken}`);

            expect(res.status).toBe(204);

            // 验证用户已被删除
            const checkRes = await request(app)
                .get('/users/1')
                .set('Authorization', `Bearer ${testToken}`);
            expect(checkRes.status).toBe(404);
        });

        it('should return 404 for non-existent user', async () => {
            const res = await request(app)
                .delete('/users/999')
                .set('Authorization', `Bearer ${testToken}`);

            expect(res.status).toBe(404);
        });
    });
});