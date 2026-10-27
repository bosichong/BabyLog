const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { verifyToken } = require('../middleware/auth');
const { transcodeToMp4 } = require('../utils/transcode');

const UPLOAD_ROOT = path.join(__dirname, '../uploads');
const VIDEO_ROOT = path.join(UPLOAD_ROOT, 'videos');
const TMP_ROOT = path.join(VIDEO_ROOT, 'tmp');
const MAX_SIZE_MB = 500;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024; // 上传文件与转码成品都受此限制

// 确保目录存在
for (const dir of [VIDEO_ROOT, TMP_ROOT]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`视频目录已创建: ${dir}`);
  }
}

const pad = (n) => String(n).padStart(2, '0');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, TMP_ROOT);
  },
  filename: function (req, file, cb) {
    const now = new Date();
    const suffix = path.extname(file.originalname || '').toLowerCase() || '.mov';
    const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
                  `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    cb(null, `${stamp}_${Date.now() % 1000}${suffix}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: function (req, file, cb) {
    if (!file.mimetype || !file.mimetype.startsWith('video/')) {
      return cb(new Error('只支持上传视频文件'));
    }
    cb(null, true);
  }
});

/**
 * 上传视频：接收 → 临时目录 → 转码为通用 mp4 → 正式目录 → 删临时文件
 * 只返回文件信息，不创建数据库记录（与图片上传保持一致）
 */
router.post('/uploadfile', verifyToken, function (req, res) {
  upload.single('file')(req, res, async function (err) {
    if (err) {
      const message = err.code === 'LIMIT_FILE_SIZE'
        ? `视频超过 ${MAX_SIZE_MB}MB 上限，未上传，请压缩或裁剪后再试`
        : err.message || '上传失败';
      return res.status(400).json({ message });
    }

    if (!req.file) {
      return res.status(400).json({ message: '没有上传文件' });
    }

    const tmpPath = req.file.path;
    let outputPath = null;

    try {
      const now = new Date();
      const year = String(now.getFullYear());
      const yearDir = path.join(VIDEO_ROOT, year);
      if (!fs.existsSync(yearDir)) {
        fs.mkdirSync(yearDir, { recursive: true });
      }

      const baseName = path.basename(req.file.filename, path.extname(req.file.filename));
      const outName = `${baseName}.mp4`;
      outputPath = path.join(yearDir, outName);

      console.log(`开始转码: ${req.file.filename} -> ${outName}`);
      const startedAt = Date.now();
      const info = await transcodeToMp4(tmpPath, outputPath);
      const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);

      const size = fs.statSync(outputPath).size;

      // 转码后同样受上限约束：H.264 相比 HEVC 有时反而更大
      if (size > MAX_SIZE_BYTES) {
        const sizeMB = (size / 1024 / 1024).toFixed(1);
        fs.unlinkSync(outputPath);
        console.log(`转码后超过上限，已删除: ${outName} (${sizeMB}MB)`);
        return res.status(400).json({
          message: `转码后视频 ${sizeMB}MB，超过 ${MAX_SIZE_MB}MB 上限，请压缩或裁剪后再试`
        });
      }

      const relPath = path.posix.join('videos', year, outName);

      console.log(`转码完成: ${outName} ${(size / 1024 / 1024).toFixed(1)}MB 用时 ${elapsed}s`);

      res.json({
        message: 'success',
        file_name: outName,
        storage_path: relPath,
        file_url: relPath,
        duration: info.duration,
        size_bytes: size,
        width: info.width,
        height: info.height
      });
    } catch (error) {
      console.error('视频转码失败:', error.message);
      // 清理可能生成的不完整输出
      if (outputPath && fs.existsSync(outputPath)) {
        try { fs.unlinkSync(outputPath); } catch (_) {}
      }
      res.status(500).json({ message: '视频转码失败，请确认文件是有效的视频格式' });
    } finally {
      // 无论成败都清理临时文件
      if (fs.existsSync(tmpPath)) {
        try { fs.unlinkSync(tmpPath); } catch (_) {}
      }
    }
  });
});

/**
 * 删除视频文件（用于未保存日志就离开时清理）
 */
router.post('/delete', verifyToken, async function (req, res) {
  try {
    const { video_path } = req.body;
    if (!video_path) {
      return res.status(400).json({ message: '缺少 video_path' });
    }

    const absPath = path.resolve(UPLOAD_ROOT, video_path);

    // 防目录穿越：只允许删除 videos 目录内的文件
    if (!absPath.startsWith(VIDEO_ROOT + path.sep)) {
      return res.status(400).json({ message: '非法路径' });
    }

    if (!fs.existsSync(absPath)) {
      return res.status(404).json({ message: '文件不存在' });
    }

    fs.unlinkSync(absPath);
    console.log('视频文件已删除:', video_path);
    res.json({ success: true });
  } catch (error) {
    console.error('删除视频失败:', error);
    res.status(500).json({ message: '删除失败' });
  }
});

module.exports = router;
