const express = require('express');
const router = express.Router();
// 移除直接导入Photo模型，改为通过req.models访问
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { verifyToken } = require('../middleware/auth');
const { sendError } = require('../utils/api-error');
const { sendSuccess } = require('../utils/api-response');

// 配置文件上传
const PHOTO_PATH = path.join(__dirname, '../uploads');
const PHOTO_URL = `${process.env.BASE_URL}/uploads/`;

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const today = new Date();
        const year_str = today.getFullYear().toString();
        const temp_path = path.join(PHOTO_PATH, year_str);
        
        if (!fs.existsSync(temp_path)) {
            fs.mkdirSync(temp_path, { recursive: true });
        }
        cb(null, temp_path);
    },
    filename: function (req, file, cb) {
        const today = new Date();
        const file_suffix = path.extname(file.originalname);
        const file_name = `${today.getFullYear()}${today.getMonth() + 1}${today.getDate()}${today.getHours()}${today.getMinutes()}${today.getMilliseconds()}${file_suffix}`;
        cb(null, file_name);
    }
});

const upload = multer({ storage: storage });

// 上传图片
router.post('/uploadfile', verifyToken, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return sendError(req, res, 400, '没有上传文件');
        }

        const today = new Date();
        const year_str = today.getFullYear().toString();
        const file_name = req.file.filename;
        const f_path = path.join(year_str, file_name);
        const file_url = `${year_str}/${file_name}`;

        // 返回文件信息，但不创建数据库记录
        return sendSuccess(res, {
            storage_path: f_path,
            file_name: file_name,
            file_url: file_url
        });
    } catch (error) {
        return sendError(req, res, 500, '上传图片失败', error);
    }
});

// 删除图片
router.post('/delete_img', verifyToken, async (req, res) => {
    try {
        const { photo_path } = req.body;
        const file_path = path.join(PHOTO_PATH, photo_path);

        // 查找并删除数据库记录
        const photo = await req.models.Photo.findOne({
            where: { storage_path: photo_path }
        });

        if (photo) {
            await photo.destroy();
        }

        if (fs.existsSync(file_path)) {
            console.log('文件存在，准备删除...');
            fs.unlinkSync(file_path);
            console.log('文件已成功删除');
            return sendSuccess(res, { deleted: true });
        } else {
            console.log('文件不存在:', file_path);
            return sendError(req, res, 404, '文件不存在');
        }
    } catch (error) {
        return sendError(req, res, 500, '删除图片失败', error);
    }
});

// 获取所有照片
router.get('/', verifyToken, async (req, res) => {
    try {
        const photos = await req.models.Photo.findAll();
        return sendSuccess(res, photos);
    } catch (error) {
        return sendError(req, res, 500, '获取图片列表失败', error);
    }
});

// 根据ID删除照片
router.post('/:id', verifyToken, async (req, res) => {
    try {
        const photo = await req.models.Photo.findByPk(req.params.id);
        if (!photo) {
            return sendError(req, res, 404, '照片不存在');
        }

        const file_path = path.join(PHOTO_PATH, photo.storage_path);
        if (fs.existsSync(file_path)) {
            fs.unlinkSync(file_path);
        }

        await photo.destroy();
        console.log('数据库记录已删除');
        return sendSuccess(res, { deleted: true });
    } catch (error) {
        return sendError(req, res, 500, '通过ID删除图片失败', error);
    }
});

module.exports = router;
