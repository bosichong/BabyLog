const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

// 获取所有婴儿信息
router.get('/', verifyToken, async (req, res) => {
  try {
    const babies = await req.models.Baby.findAll({
      include: [{ model: req.models.Healthy, as: 'healthies' }]
    });
    res.json(babies);
  } catch (error) {
    console.error('获取婴儿列表失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取婴儿列表失败'
    });
  }
});

// 获取婴儿博客数量
router.get('/:id/blogs/count', verifyToken, async (req, res) => {
  try {
    const count = await req.models.Blog.count({
      include: [{
        model: req.models.Baby,
        where: {
          id: req.params.id
        },
        attributes: []
      }]
    });
    res.json({ count });
  } catch (error) {
    console.error('获取博客数量失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取博客数量失败'
    });
  }
});

// 获取单个婴儿信息
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const baby = await req.models.Baby.findByPk(req.params.id, {
      include: [{ model: req.models.Healthy, as: 'healthies' }]
    });
    if (!baby) {
      return res.status(404).json({
        status: 'error',
        message: '婴儿信息不存在'
      });
    }
    res.json(baby);
  } catch (error) {
    console.error('获取婴儿信息失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取婴儿信息失败'
    });
  }
});

// 创建婴儿信息
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, birthday } = req.body;
    const baby = await req.models.Baby.create({
      name,
      birthday: new Date(birthday)
    });
    res.status(201).json(baby);
  } catch (error) {
    console.error('创建婴儿信息失败:', error);
    res.status(500).json({
      status: 'error',
      message: '创建婴儿信息失败'
    });
  }
});

// 更新婴儿信息
router.post('/:id/update', verifyToken, async (req, res) => {
  try {
    const { name, birthday, sex } = req.body;
    
    // 验证日期格式
    const birthdayDate = new Date(birthday);
    if (isNaN(birthdayDate.getTime())) {
      return res.status(400).json({
        status: 'error',
        message: '无效的出生日期格式，请使用YYYY-MM-DD格式'
      });
    }

    const baby = await req.models.Baby.findByPk(req.params.id);
    if (!baby) {
      return res.status(404).json({
        status: 'error',
        message: '婴儿信息不存在'
      });
    }

    // 格式化日期为ISO字符串的日期部分
    const formattedBirthday = birthdayDate.toISOString().split('T')[0];
    
    await baby.update({
      name,
      birthday: formattedBirthday,
      sex
    });
    res.json(baby);
  } catch (error) {
    console.error('更新婴儿信息失败:', error);
    res.status(500).json({
      status: 'error',
      message: '更新婴儿信息失败'
    });
  }
});

// 删除婴儿信息
router.post('/:id/delete', verifyToken, async (req, res) => {
  try {
    const baby = await req.models.Baby.findByPk(req.params.id);
    if (!baby) {
      return res.status(404).json({
        status: 'error',
        message: '婴儿信息不存在'
      });
    }
    await baby.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('删除婴儿信息失败:', error);
    res.status(500).json({
      status: 'error',
      message: '删除婴儿信息失败'
    });
  }
});

module.exports = router;