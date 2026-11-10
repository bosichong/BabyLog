const express = require('express');
const router = express.Router();
const { verifyToken, hashPassword } = require('../middleware/auth');
const { sendError } = require('../utils/api-error');
const { sendSuccess } = require('../utils/api-response');

// 获取所有用户
router.get('/', verifyToken, async (req, res) => {
  try {
    const users = await req.models.User.findAll({
      attributes: { exclude: ['hashed_password'] }
    });
    return sendSuccess(res, users);
  } catch (error) {
    return sendError(req, res, 500, '获取用户列表失败', error);
  }
});

// 获取单个用户
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const user = await req.models.User.findByPk(req.params.id, {
      attributes: { exclude: ['hashed_password'] }
    });
    if (!user) {
      return sendError(req, res, 404, '用户不存在');
    }
    return sendSuccess(res, user);
  } catch (error) {
    return sendError(req, res, 500, '获取用户失败', error);
  }
});

// 创建用户
router.post('/', verifyToken, async (req, res) => {
  try {
    const { username, password, family_member, gender } = req.body;
    const hashedPassword = await hashPassword(password);
    const user = await req.models.User.create({
      username,
      hashed_password: hashedPassword,
      family_member,
      gender,
      is_active: true
    });
    const { hashed_password, ...userWithoutPassword } = user.toJSON();
    return sendSuccess(res, userWithoutPassword, { status: 201 });
  } catch (error) {
    return sendError(req, res, 500, '创建用户失败', error);
  }
});

// 更新用户
router.post('/:id/update', verifyToken, async (req, res) => {
  try {
    const { family_member, gender, is_active, password } = req.body;
    const user = await req.models.User.findByPk(req.params.id);
    if (!user) {
      return sendError(req, res, 404, '用户不存在');
    }
    const updateData = {};
    if (family_member !== undefined) updateData.family_member = family_member;
    if (gender !== undefined && gender !== null) updateData.gender = gender;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (password) {
      updateData.hashed_password = await hashPassword(password);
    }

    await user.update(updateData);
    const { hashed_password, ...userWithoutPassword } = user.toJSON();
    return sendSuccess(res, userWithoutPassword);
  } catch (error) {
    return sendError(req, res, 500, '更新用户失败', error);
  }
});

// 删除用户
router.post('/:id/delete', verifyToken, async (req, res) => {
  try {
    const user = await req.models.User.findByPk(req.params.id);
    if (!user) {
      return sendError(req, res, 404, '用户不存在');
    }
    await user.destroy();
    return res.status(204).send();
  } catch (error) {
    return sendError(req, res, 500, '删除用户失败', error);
  }
});

module.exports = router;
