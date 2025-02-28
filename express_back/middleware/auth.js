const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// JWT配置
const JWT_SECRET = 'ededcbe81f2e015697780d536196c0baa6ea26021ad7070867e40b18a51ff8da';
const JWT_EXPIRES_IN = '5h';

// 密码哈希函数
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// 密码验证函数
const verifyPassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

// 生成JWT token
const generateToken = (username) => {
  return jwt.sign({ sub: username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// 验证用户身份
const authenticateUser = async (models, username, password) => {
  const user = await models.User.findOne({ where: { username } });
  if (!user) {
    return { success: false, error: 'USER_NOT_FOUND', message: '用户不存在' };
  }
  
  const isValidPassword = await verifyPassword(password, user.hashed_password);
  if (!isValidPassword) {
    return { success: false, error: 'INVALID_PASSWORD', message: '密码错误' };
  }

  if (user.is_active === false) {
    return { success: false, error: 'ACCOUNT_DISABLED', message: '账户已被禁用' };
  }

  return { success: true, user };
};

// 验证Token中间件
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: '未提供认证令牌' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await req.models.User.findOne({ 
      where: { username: decoded.sub }
    });

    if (!user) {
      return res.status(401).json({ message: '用户不存在' });
    }

    if (!user.is_active) {
      return res.status(401).json({ message: '账户已被禁用' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: '无效的认证令牌' });
  }
};

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  authenticateUser,
  verifyToken
};