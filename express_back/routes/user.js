const express = require('express');
const router = express.Router();
const { verifyToken, hashPassword } = require('../middleware/auth');

// 获取所有用户
router.get('/', verifyToken, async (req, res) => {
  try {
    const users = await req.models.User.findAll({
      attributes: { exclude: ['hashed_password'] }
    });
    res.json(users);
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取用户列表失败'
    });
  }
});

// 获取单个用户
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const user = await req.models.User.findByPk(req.params.id, {
      attributes: { exclude: ['hashed_password'] }
    });
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '用户不存在'
      });
    }
    res.json(user);
  } catch (error) {
    console.error('获取用户失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取用户失败'
    });
  }
});

// 创建用户
router.post('/', verifyToken, async (req, res) => {
  try {
    const { username, password, familymember, sex } = req.body;
    const hashedPassword = await hashPassword(password);
    const user = await req.models.User.create({
      username,
      hashed_password: hashedPassword,
      familymember,
      sex,
      is_active: true
    });
    const { hashed_password, ...userWithoutPassword } = user.toJSON();
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('创建用户失败:', error);
    res.status(500).json({
      status: 'error',
      message: '创建用户失败'
    });
  }
});

// 更新用户
router.post('/:id/update', verifyToken, async (req, res) => {
  try {
    const { familymember, sex, is_active, password } = req.body;
    const user = await req.models.User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '用户不存在'
      });
    }
    const updateData = {};
    if (familymember !== undefined) updateData.familymember = familymember;
    if (sex !== undefined && sex !== null) updateData.sex = sex;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (password) {
      updateData.hashed_password = await hashPassword(password);
    }

    await user.update(updateData);
    const { hashed_password, ...userWithoutPassword } = user.toJSON();
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('更新用户失败:', error);
    res.status(500).json({
      status: 'error',
      message: '更新用户失败'
    });
  }
});

// 删除用户
router.post('/:id/delete', verifyToken, async (req, res) => {
  try {
    const user = await req.models.User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '用户不存在'
      });
    }
    await user.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('删除用户失败:', error);
    res.status(500).json({
      status: 'error',
      message: '删除用户失败'
    });
  }
});

module.exports = router;