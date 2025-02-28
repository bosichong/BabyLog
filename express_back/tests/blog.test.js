const request = require('supertest');
const express = require('express');
const { Sequelize } = require('sequelize');
const initModels = require('../models/init-models');
const blogRouter = require('../routes/blog');
const { generateToken } = require('../middleware/auth');

describe('Blog API Tests', () => {
    let app;
    let sequelize;
    let models;
    let testToken;
    let testUser;
    let testBaby;

    beforeAll(async () => {
        // 设置测试数据库
        sequelize = new Sequelize('sqlite::memory:', { logging: false });
        models = initModels(sequelize);

        // 创建Express应用
        app = express();
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));

        // 添加models到请求对象
        app.use((req, res, next) => {
            req.models = models;
            next();
        });

        // 注册路由
        app.use('/v1', blogRouter);

        // 同步数据库
        await sequelize.sync({ force: true });

        // 创建测试用户
        testUser = await models.User.create({
            username: 'testuser',
            hashed_password: 'testpassword',
            familymember: '测试成员',
            sex: '1',
            is_active: true
        });

        // 创建测试婴儿
        testBaby = await models.Baby.create({
            name: '测试宝宝',
            birthday: new Date()
        });

        // 生成测试用token
        testToken = generateToken('testuser');
    });

    afterAll(async () => {
        await sequelize.close();
    });

    describe('GET /v1/blogs', () => {
        it('should return all blogs', async () => {
            const blog = await models.Blog.create({
                blog: '测试博客内容',
                user_id: testUser.id
            });
            await blog.setBabies([testBaby]);

            const res = await request(app)
                .get('/v1/blogs')
                .set('Authorization', `Bearer ${testToken}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBeTruthy();
            expect(res.body.length).toBe(1);
            expect(res.body[0].blog).toBe('测试博客内容');
            expect(res.body[0].User).toBeDefined();
            expect(res.body[0].babies).toBeDefined();
        });

        it('should return 401 without token', async () => {
            const res = await request(app).get('/v1/blogs');
            expect(res.status).toBe(401);
        });
    });

    describe('GET /v1/blogs/:id', () => {
        it('should return blog by id', async () => {
            const blog = await models.Blog.create({
                blog: '测试单个博客',
                user_id: testUser.id
            });
            await blog.setBabies([testBaby]);

            const res = await request(app)
                .get(`/v1/blogs/${blog.id}`)
                .set('Authorization', `Bearer ${testToken}`);

            expect(res.status).toBe(200);
            expect(res.body.blog).toBe('测试单个博客');
            expect(res.body.User).toBeDefined();
            expect(res.body.babies).toBeDefined();
        });

        it('should return 404 for non-existent blog', async () => {
            const res = await request(app)
                .get('/v1/blogs/999')
                .set('Authorization', `Bearer ${testToken}`);

            expect(res.status).toBe(404);
        });
    });

    describe('POST /v1/blogs', () => {
        it('should create new blog', async () => {
            const blogData = {
                blog: '新建博客内容',
                user_id: testUser.id,
                baby_ids: [testBaby.id]
            };

            const res = await request(app)
                .post('/v1/blogs')
                .set('Authorization', `Bearer ${testToken}`)
                .send(blogData);

            expect(res.status).toBe(201);
            expect(res.body.blog).toBe('新建博客内容');
            expect(res.body.User).toBeDefined();
            expect(res.body.babies).toBeDefined();
            expect(res.body.babies.length).toBe(1);
        });
    });

    describe('PUT /v1/blogs/:id', () => {
        it('should update blog', async () => {
            const blog = await models.Blog.create({
                blog: '待更新博客',
                user_id: testUser.id
            });
            await blog.setBabies([testBaby]);

            const updateData = {
                blog: '已更新博客',
                baby_ids: [testBaby.id]
            };

            const res = await request(app)
                .put(`/v1/blogs/${blog.id}`)
                .set('Authorization', `Bearer ${testToken}`)
                .send(updateData);

            expect(res.status).toBe(200);
            expect(res.body.blog).toBe('已更新博客');
            expect(res.body.babies).toBeDefined();
            expect(res.body.babies.length).toBe(1);
        });

        it('should return 404 for non-existent blog', async () => {
            const res = await request(app)
                .put('/v1/blogs/999')
                .set('Authorization', `Bearer ${testToken}`)
                .send({ blog: '测试' });

            expect(res.status).toBe(404);
        });
    });

    describe('DELETE /v1/blogs/:id', () => {
        it('should delete blog', async () => {
            const blog = await models.Blog.create({
                blog: '待删除博客',
                user_id: testUser.id
            });

            const res = await request(app)
                .delete(`/v1/blogs/${blog.id}`)
                .set('Authorization', `Bearer ${testToken}`);

            expect(res.status).toBe(204);

            // 验证博客已被删除
            const checkRes = await request(app)
                .get(`/v1/blogs/${blog.id}`)
                .set('Authorization', `Bearer ${testToken}`);
            expect(checkRes.status).toBe(404);
        });

        it('should return 404 for non-existent blog', async () => {
            const res = await request(app)
                .delete('/v1/blogs/999')
                .set('Authorization', `Bearer ${testToken}`);

            expect(res.status).toBe(404);
        });
    });
});