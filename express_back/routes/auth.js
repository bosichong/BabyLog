const express = require('express');
const router = express.Router();
const { authenticateUser, generateToken, hashPassword } = require('../middleware/auth');

// 登录路由
router.post('/token', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 验证用户身份
    const authResult = await authenticateUser(req.models, username, password);
    if (!authResult.success) {
      return res.status(401).json({
        status: 'error',
        error: authResult.error,
        message: authResult.message
      });
    }

    // 生成访问令牌
    const access_token = generateToken(authResult.user.username);

    // 返回令牌
    return res.json({
      access_token,
      token_type: 'bearer'
    });

  } catch (error) {
    console.error('登录错误:', error);
    return res.status(500).json({
      status: 'error',
      message: '登录过程中发生错误'
    });
  }
});

// 注册路由
router.post('/register', async (req, res) => {
  try {
    const { username, password, familymember, sex } = req.body;

    // 检查用户名是否已存在
    const existingUser = await req.models.User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: '用户名已存在'
      });
    }

    // 对密码进行加密
    const hashedPassword = await hashPassword(password);

    // 创建新用户，默认状态为停用
    const user = await req.models.User.create({
      username,
      hashed_password: hashedPassword,
      familymember,
      sex,
      is_active: false // 默认为停用状态，需要管理员激活
    });

    // 返回用户信息（不包含密码）
    const { hashed_password, ...userWithoutPassword } = user.toJSON();
    res.status(201).json({
      status: 'success',
      message: '注册成功，请等待管理员审核激活',
      data: userWithoutPassword
    });

  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      status: 'error',
      message: '注册过程中发生错误'
    });
  }
});

module.exports = router;