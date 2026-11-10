const express = require('express');
const router = express.Router();
const { authenticateUser, generateToken, hashPassword } = require('../middleware/auth');
const { sendError } = require('../utils/api-error');
const { sendSuccess } = require('../utils/api-response');

// 登录路由
router.post('/token', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 验证用户身份
    const authResult = await authenticateUser(req.models, username, password);
    if (!authResult.success) {
      return sendError(req, res, 401, authResult.message, null, {
        error: authResult.error
      });
    }

    // 生成访问令牌
    const access_token = generateToken(authResult.user.username);

    // 返回令牌
    return sendSuccess(res, {
      access_token,
      token_type: 'bearer'
    });

  } catch (error) {
    return sendError(req, res, 500, '登录过程中发生错误', error);
  }
});

// 注册路由
router.post('/register', async (req, res) => {
  try {
    const { username, password, family_member, gender } = req.body;

    // 检查用户名是否已存在
    const existingUser = await req.models.User.findOne({ where: { username } });
    if (existingUser) {
      return sendError(req, res, 400, '用户名已存在');
    }

    // 对密码进行加密
    const hashedPassword = await hashPassword(password);

    // 创建新用户，默认状态为停用
    const user = await req.models.User.create({
      username,
      hashed_password: hashedPassword,
      family_member,
      gender,
      is_active: false // 默认为停用状态，需要管理员激活
    });

    // 返回用户信息（不包含密码）
    const { hashed_password, ...userWithoutPassword } = user.toJSON();
    return sendSuccess(res, userWithoutPassword, {
      status: 201,
      message: '注册成功，请等待管理员审核激活'
    });

  } catch (error) {
    return sendError(req, res, 500, '注册过程中发生错误', error);
  }
});

module.exports = router;
