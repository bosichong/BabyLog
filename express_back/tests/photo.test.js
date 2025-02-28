const request = require('supertest');
const express = require('express');
const { Sequelize } = require('sequelize');
const initModels = require('../models/init-models');
const photoRouter = require('../routes/photo');
const { generateToken } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

describe('Photo API Tests', () => {
    let app;
    let sequelize;
    let models;
    let testToken;
    const testPhotoPath = 'test.jpg';
    const PHOTO_PATH = path.join(__dirname, '../uploads');

    beforeAll(async () => {
        // 设置测试数据库
        sequelize = new Sequelize('sqlite::memory:', { logging: false });
        models = initModels(sequelize);

        // 确保Photo模型被正确初始化
        models.Photo = sequelize.define('Photo', {
            file_name: {
                type: Sequelize.STRING,
                allowNull: false
            },
            file_path: {
                type: Sequelize.STRING,
                allowNull: false
            },
            file_url: {
                type: Sequelize.STRING,
                allowNull: false
            }
        });

        // 创建Express应用
        app = express();
        app.use(express.json());

        // 添加models到请求对象
        app.use((req, res, next) => {
            req.models = models;
            next();
        });

        app.use('/', photoRouter);

        // 同步数据库并创建测试用户
        await sequelize.sync({ force: true });
        
        // 创建测试用户
        await models.User.create({
            username: 'testuser',
            hashed_password: 'testpassword',
            familymember: '测试用户',
            sex: '1',
            is_active: true
        });

        // 生成测试用token
        testToken = generateToken('testuser');

        // 创建测试用的图片文件
        const testFilePath = path.join(PHOTO_PATH, testPhotoPath);
        if (!fs.existsSync(testFilePath)) {
            fs.writeFileSync(testFilePath, 'test image content');
        }
    });

    afterAll(async () => {
        // 清理测试文件
        const testFilePath = path.join(PHOTO_PATH, testPhotoPath);
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
        }
        await sequelize.close();
    });

    describe('POST /uploadfile', () => {
        it('should upload file successfully', async () => {
            const res = await request(app)
                .post('/uploadfile')
                .set('Authorization', `Bearer ${testToken}`)
                .attach('file', path.join(PHOTO_PATH, testPhotoPath));

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('message', 'success');
            expect(res.body).toHaveProperty('file_path');
            expect(res.body).toHaveProperty('file_name');
            expect(res.body).toHaveProperty('file_url');

            // 清理上传的文件
            if (res.body.file_path && fs.existsSync(path.join(PHOTO_PATH, res.body.file_path))) {
                fs.unlinkSync(path.join(PHOTO_PATH, res.body.file_path));
            }
        });

        it('should return 400 when no file is uploaded', async () => {
            const res = await request(app)
                .post('/uploadfile')
                .set('Authorization', `Bearer ${testToken}`);

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('message', '没有上传文件');
        });

        it('should return 401 without token', async () => {
            const res = await request(app)
                .post('/uploadfile')
                .attach('file', path.join(PHOTO_PATH, testPhotoPath));

            expect(res.status).toBe(401);
        });
    });

    describe('POST /delete_img', () => {
        it('should delete file successfully', async () => {
            // 先创建一个测试文件
            const testDeletePath = 'test_delete.jpg';
            fs.writeFileSync(path.join(PHOTO_PATH, testDeletePath), 'test content');

            const res = await request(app)
                .post('/delete_img')
                .set('Authorization', `Bearer ${testToken}`)
                .send({ photo_path: testDeletePath });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(fs.existsSync(path.join(PHOTO_PATH, testDeletePath))).toBe(false);
        });

        it('should return 404 for non-existent file', async () => {
            const res = await request(app)
                .post('/delete_img')
                .set('Authorization', `Bearer ${testToken}`)
                .send({ photo_path: 'nonexistent.jpg' });

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('message', '文件不存在');
        });

        it('should return 401 without token', async () => {
            const res = await request(app)
                .post('/delete_img')
                .send({ photo_path: testPhotoPath });

            expect(res.status).toBe(401);
        });
    });

    describe('GET /', () => {
        it('should return all photos', async () => {
            // 先创建一个测试照片记录
            await models.Photo.create({
                file_name: 'test.jpg',
                file_path: 'test/test.jpg',
                file_url: 'test/test.jpg'
            });

            const res = await request(app)
                .get('/')
                .set('Authorization', `Bearer ${testToken}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBeTruthy();
            expect(res.body.length).toBe(1);
            expect(res.body[0]).toHaveProperty('file_name', 'test.jpg');
        });

        it('should return 401 without token', async () => {
            const res = await request(app).get('/');
            expect(res.status).toBe(401);
        });
    });

    describe('DELETE /:id', () => {
        it('should delete photo by id', async () => {
            // 先创建一个测试照片记录和文件
            const testFile = 'test_delete_by_id.jpg';
            fs.writeFileSync(path.join(PHOTO_PATH, testFile), 'test content');

            const photo = await models.Photo.create({
                file_name: testFile,
                file_path: testFile,
                file_url: testFile
            });

            const res = await request(app)
                .delete(`/${photo.id}`)
                .set('Authorization', `Bearer ${testToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);

            // 验证数据库记录和文件都已被删除
            const checkPhoto = await models.Photo.findByPk(photo.id);
            expect(checkPhoto).toBeNull();
            expect(fs.existsSync(path.join(PHOTO_PATH, testFile))).toBe(false);
        });

        it('should return 404 for non-existent photo', async () => {
            const res = await request(app)
                .delete('/999')
                .set('Authorization', `Bearer ${testToken}`);

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('message', '照片不存在');
        });

        it('should return 401 without token', async () => {
            const res = await request(app).delete('/1');
            expect(res.status).toBe(401);
        });
    });
});