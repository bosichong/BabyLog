const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

// 获取所有博客（支持分页和搜索）
router.post('/search', verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.body.page) || 1;
    const pageSize = parseInt(req.body.pageSize) || 10;
    const keyword = req.body.keyword || '';
    
    const offset = (page - 1) * pageSize;
    const { Op } = require('sequelize');

    // 构建查询条件
    const where = keyword ? {
      blog: {
        [Op.like]: `%${keyword}%`
      }
    } : {};

    // 获取总记录数
    const total = await req.models.Blog.count({ where });

    // 获取分页数据
    const blogs = await req.models.Blog.findAll({
      where,
      include: [
        { model: req.models.User },
        { model: req.models.Baby },
        { model: req.models.Photo }
      ],
      offset: parseInt(offset),
      limit: parseInt(pageSize),
      order: [['create_time', 'DESC']]
    });

    const response = {
      items: blogs,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(total / pageSize)
    };

    res.json(response);
  } catch (error) {
    console.error('获取博客列表失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取博客列表失败'
    });
  }
});

// 获取单个博客
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const blog = await req.models.Blog.findByPk(req.params.id, {
      include: [
        { model: req.models.User },
        { model: req.models.Baby },
        { model: req.models.Photo }
      ]
    });
    if (!blog) {
      return res.status(404).json({
        status: 'error',
        message: '博客不存在'
      });
    }
    res.json(blog);
  } catch (error) {
    console.error('获取博客失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取博客失败'
    });
  }
});

// 创建博客
router.post('/', verifyToken, async (req, res) => {
  try {
    console.log('开始创建博客...');
    const { blog: content, baby_ids, photo_ids } = req.body;

    console.log('请求参数:', {
      content: content ? `${content.substring(0, 50)}...` : null,
      user_id: req.user.id,
      baby_ids,
      photo_ids
    });
    let createdBlog = null;

    try {
      console.log('开始保存博客内容...');
      // 创建博客
      createdBlog = await req.models.Blog.create({
        blog: content,
        user_id: req.user.id
      });
      console.log('博客内容保存成功，ID:', createdBlog.id);

      // 关联婴儿
      if (baby_ids && baby_ids.length > 0) {
        console.log('开始关联婴儿信息...');
        const babies = await req.models.Baby.findAll({
          where: {
            id: baby_ids
          }
        });
        console.log('找到要关联的婴儿数量:', babies.length);
        await createdBlog.setBabies(babies);
        console.log('婴儿关联完成');      
      }

      // 关联图片
      if (photo_ids && photo_ids.length > 0) {
        console.log('开始关联图片...');
        // 创建图片记录
        const photoRecords = await Promise.all(photo_ids.map(async (photoInfo) => {
          return await req.models.Photo.create({
            file_name: photoInfo.file_name,
            file_path: photoInfo.file_path,
            file_url: photoInfo.file_url,
            blog_id: createdBlog.id,
            user_id: req.user.id
          });
        }));
        console.log('图片关联完成，创建图片记录数量:', photoRecords.length);
      }

      console.log('开始获取完整博客信息...');
      // 获取完整的博客信息
      const fullBlog = await req.models.Blog.findByPk(createdBlog.id, {
        include: [
          { model: req.models.User },
          { model: req.models.Baby },
          { model: req.models.Photo }
        ]
      });
      console.log('博客创建完成，返回完整数据');
      res.status(201).json(fullBlog);
    } catch (error) {
      console.error('博客创建过程中发生错误:', error);
      // 如果博客创建失败，清理已上传的图片
      if (photo_ids && photo_ids.length > 0) {
        console.log('开始清理已上传的图片...');
        for (const photoInfo of photo_ids) {
          const filePath = path.join(__dirname, '..', 'uploads', photoInfo.file_path);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      }

      // 如果博客已创建但后续操作失败，删除博客
      if (createdBlog) {
        console.log('删除已创建的博客记录...');
        await createdBlog.destroy();
        console.log('博客记录删除完成');
      }

      throw error;
    }
  } catch (error) {
    console.error('创建博客失败:', error);
    res.status(500).json({
      status: 'error',
      message: '创建博客失败，已清理相关数据'
    });
  }
});

// 更新博客
router.post('/:id/update', verifyToken, async (req, res) => {
  // 参数验证
  const { blog: content, baby_ids, photo_ids = [], removed_photo_ids = [] } = req.body;
  if (!content || content.trim().length === 0) {
    return res.status(400).json({
      status: 'error',
      message: '博客内容不能为空'
    });
  }

  if (baby_ids && !Array.isArray(baby_ids)) {
    return res.status(400).json({
      status: 'error',
      message: '婴儿ID列表格式不正确'
    });
  }

  if (!Array.isArray(photo_ids) || !Array.isArray(removed_photo_ids)) {
    return res.status(400).json({
      status: 'error',
      message: '图片ID列表格式不正确'
    });
  }

  const transaction = await req.models.Blog.sequelize.transaction();
  
  try {
    const blog = await req.models.Blog.findByPk(req.params.id, {
      include: [{ model: req.models.Photo }],
      transaction
    });

    if (!blog) {
      await transaction.rollback();
      return res.status(404).json({
        status: 'error',
        message: '博客不存在'
      });
    }

    // 更新博客内容
    await blog.update({ blog: content }, { transaction });

    // 使用Set优化图片去重逻辑
    const existingPhotoPathSet = new Set(blog.photos.map(photo => photo.file_path));
    const newPhotoIds = photo_ids.filter(photoInfo => !existingPhotoPathSet.has(photoInfo.file_path));

    // 处理要删除的图片，复用已查询的photos数据
    if (removed_photo_ids.length > 0) {
      const photosToRemove = blog.photos.filter(photo => removed_photo_ids.includes(photo.id));
      for (const photo of photosToRemove) {
        const filePath = path.join(__dirname, '..', 'uploads', photo.file_path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        await photo.destroy({ transaction });
      }
    }

    // 添加新图片
    if (newPhotoIds.length > 0) {
      await Promise.all(newPhotoIds.map(async (photoInfo) => {
        return await req.models.Photo.create({
          file_name: photoInfo.file_name,
          file_path: photoInfo.file_path,
          file_url: photoInfo.file_url,
          blog_id: blog.id,
          user_id: req.user.id
        }, { transaction });
      }));
    }

    // 更新与婴儿的关联
    if (baby_ids) {
      const babies = await req.models.Baby.findAll({
        where: {
          id: baby_ids
        },
        transaction
      });
      await blog.setBabies(babies, { transaction });
    }

    // 获取更新后的完整博客信息
    const updatedBlog = await req.models.Blog.findByPk(blog.id, {
      include: [
        {
          model: req.models.User,
          attributes: ['id', 'username', 'familymember']
        },
        {
          model: req.models.Baby,
          through: { attributes: [] }
        },
        { model: req.models.Photo }
      ],
      transaction
    });

    await transaction.commit();
    res.json({
      status: 'success',
      message: '博客更新成功',
      data: updatedBlog
    });
  } catch (error) {
    await transaction.rollback();
    console.error('更新博客失败:', error);
    res.status(500).json({
      status: 'error',
      message: '更新博客失败：' + error.message
    });
  }
});

// 删除博客
router.delete('/:id', verifyToken, async (req, res) => {
  const transaction = await req.models.Blog.sequelize.transaction();
  
  try {
    const blog = await req.models.Blog.findByPk(req.params.id, {
      include: [{ model: req.models.Photo }],
      transaction
    });

    if (!blog) {
      await transaction.rollback();
      return res.status(404).json({
        status: 'error',
        message: '博客不存在'
      });
    }

    // 删除博客-婴儿关联记录
    await blog.setBabies([], { transaction });

    // 删除关联的图片记录和文件
    if (blog.photos && blog.photos.length > 0) {
      for (const photo of blog.photos) {
        const filePath = path.join(__dirname, '..', 'uploads', photo.file_path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        await photo.destroy({ transaction });
      }
    }

    // 最后删除博客记录
    await blog.destroy({ transaction });

    // 所有操作成功，提交事务
    await transaction.commit();
    res.status(204).send();
  } catch (error) {
    console.error('删除博客失败:', error);
    await transaction.rollback();
    res.status(500).json({
      status: 'error',
      message: error.message || '删除博客失败'
    });
  }
});

// 获取往年今天的博客
router.get('/memories/today', verifyToken, async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const sequelize = req.models.Blog.sequelize;

    const blogs = await req.models.Blog.findAll({
      where: {
        [Op.and]: [
          sequelize.where(
            sequelize.fn('strftime', '%m-%d', sequelize.col('blog.create_time')),
            sequelize.fn('strftime', '%m-%d', sequelize.fn('datetime', 'now'))
          ),
          sequelize.where(
            sequelize.fn('strftime', '%Y', sequelize.col('blog.create_time')),
            { [Op.ne]: sequelize.fn('strftime', '%Y', sequelize.fn('datetime', 'now')) }
          ),
          {
            'create_time': {
              [Op.lt]: sequelize.fn('datetime', 'now')
            }
          }
        ]
      },
      include: [
        { model: req.models.User },
        { model: req.models.Baby },
        { model: req.models.Photo }
      ]
    });

    res.json(blogs);
  } catch (error) {
    console.error('获取往年今天的博客失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取往年今天的博客失败'
    });
  }
});

module.exports = router;