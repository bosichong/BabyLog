const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { sendError } = require('../utils/api-error');
const { sendSuccess } = require('../utils/api-response');

// 获取所有婴儿信息
router.get('/', verifyToken, async (req, res) => {
  try {
    const babies = await req.models.Baby.findAll({
      include: [{ model: req.models.Healthy, as: 'healthies' }]
    });
    return sendSuccess(res, babies);
  } catch (error) {
    return sendError(req, res, 500, '获取婴儿列表失败', error);
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
    return sendSuccess(res, { count });
  } catch (error) {
    return sendError(req, res, 500, '获取博客数量失败', error);
  }
});

// 获取单个婴儿信息
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const baby = await req.models.Baby.findByPk(req.params.id, {
      include: [{ model: req.models.Healthy, as: 'healthies' }]
    });
    if (!baby) {
      return sendError(req, res, 404, '婴儿信息不存在');
    }
    return sendSuccess(res, baby);
  } catch (error) {
    return sendError(req, res, 500, '获取婴儿信息失败', error);
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
    return sendSuccess(res, baby, { status: 201 });
  } catch (error) {
    return sendError(req, res, 500, '创建婴儿信息失败', error);
  }
});

// 更新婴儿信息
router.post('/:id/update', verifyToken, async (req, res) => {
  try {
    const { name, birthday } = req.body;
    
    // 验证日期格式
    const birthdayDate = new Date(birthday);
    if (isNaN(birthdayDate.getTime())) {
      return sendError(req, res, 400, '无效的出生日期格式，请使用YYYY-MM-DD格式');
    }

    const baby = await req.models.Baby.findByPk(req.params.id);
    if (!baby) {
      return sendError(req, res, 404, '婴儿信息不存在');
    }

    // 格式化日期为ISO字符串的日期部分
    const formattedBirthday = birthdayDate.toISOString().split('T')[0];
    
    await baby.update({
      name,
      birthday: formattedBirthday
    });
    return sendSuccess(res, baby);
  } catch (error) {
    return sendError(req, res, 500, '更新婴儿信息失败', error);
  }
});

// 删除婴儿信息
router.post('/:id/delete', verifyToken, async (req, res) => {
  try {
    const baby = await req.models.Baby.findByPk(req.params.id);
    if (!baby) {
      return sendError(req, res, 404, '婴儿信息不存在');
    }
    await baby.destroy();
    return res.status(204).send();
  } catch (error) {
    return sendError(req, res, 500, '删除婴儿信息失败', error);
  }
});

module.exports = router;
