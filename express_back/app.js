require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Sequelize } = require('sequelize');
const initModels = require('./models/init-models');
const fs = require('fs');
const path = require('path');
const { hashPassword } = require('./middleware/auth');
const { sendError } = require('./utils/api-error');
const { sendSuccess } = require('./utils/api-response');

const app = express();

function redactSensitive(value) {
  if (Array.isArray(value)) return value.map(redactSensitive);
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => {
      const normalizedKey = key.toLowerCase();
      const sensitive = normalizedKey.includes('password')
        || normalizedKey.includes('token')
        || normalizedKey === 'authorization';
      return [key, sensitive ? '[已隐藏]' : redactSensitive(item)];
    }),
  );
}

// 中间件配置
app.use(cors({
  origin: '*', // 允许所有来源访问，开发环境下使用
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // 允许的HTTP方法
  allowedHeaders: ['Content-Type', 'Authorization'], // 允许的请求头
  exposedHeaders: ['Content-Range', 'X-Content-Range'], // 允许浏览器访问的响应头
  credentials: true // 允许发送身份凭证（cookies等）
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 添加请求日志中间件
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (Object.keys(req.body).length > 0) {
    console.log('请求体:', JSON.stringify(redactSensitive(req.body), null, 2));
  }
  if (Object.keys(req.query).length > 0) {
    console.log('查询参数:', req.query);
  }

  // 捕获响应完成事件
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`响应状态: ${res.statusCode}`);
    console.log(`处理时间: ${duration}ms\n`);
  });

  next();
});

// 统一记录写操作的成功结果和所有接口失败原因。
app.use((req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = function loggedJson(body) {
    const status = res.statusCode;
    const requestLabel = `${req.method} ${req.originalUrl || req.url || ''}`;

    if (status >= 400) {
      const reason = res.locals.errorReason
        || (body && (body.reason || body.message || body.error))
        || '未提供失败原因';
      if (!res.locals.errorLogged) {
        console.error(`[API][失败] ${requestLabel} | HTTP ${status} | 原因: ${reason}`);
      }
    } else if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      console.log(`[API][成功] ${requestLabel} | HTTP ${status}`);
    }

    return originalJson(body);
  };
  next();
});

// 确保uploads目录存在
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  console.log('创建uploads目录...');
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('uploads目录创建成功');
} else {
  console.log('uploads目录已存在，无需创建');
}

// 配置静态文件目录
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 前端静态资源目录已移除

// 数据库连接配置
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'babylog_data.db'),
  logging: false
});

// 初始化数据库模型
const models = initModels(sequelize);

// 创建默认管理员账户的函数
async function createDefaultAdmin(models) {
  try {
    // 检查是否已存在任何用户
    const userCount = await models.User.count();
    if (userCount === 0) {
      // 创建默认管理员账户
      const hashedPassword = await hashPassword('123456');
      await models.User.create({
        username: 'admin',
        hashed_password: hashedPassword,
        family_member: '管理员',
        gender: 'male',
        is_active: true // 默认激活状态
      });
      console.log('默认管理员账户创建成功');
    } else {
      console.log('系统中已存在用户，无需创建默认管理员');
    }
  } catch (error) {
    console.error('创建默认管理员账户失败:', error);
  }
}

// 测试数据库连接
sequelize.authenticate()
  .then(() => {
    console.log('数据库连接成功');
    // 检查数据库是否已存在表
    return sequelize.getQueryInterface().showAllTables()
      .then(tables => {
        if (tables.length === 0) {
          // 数据库为空，创建所有表
          console.log('数据库为空，创建所有表...');
          return sequelize.sync();
        } else {
          console.log('数据库已存在表，跳过同步过程...');
          return Promise.resolve();
        }
      });
  })
  .then(() => {
    console.log('数据库模型同步成功');
    // 创建默认管理员账户
    return createDefaultAdmin(models);
  })
  .catch(err => {
    console.error('数据库连接或同步失败:', err);
  });

// 将模型对象添加到请求对象中
app.use((req, res, next) => {
  req.models = models;
  next();
});

// 导入路由
const authRouter = require('./routes/auth');
const userRouter = require('./routes/user');
const babyRouter = require('./routes/baby');
const blogRouter = require('./routes/blog');
const photoRouter = require('./routes/photo');
const healthyRouter = require('./routes/healthy');
const videoRouter = require('./routes/video');

// 注册路由
app.use('/v1/auth', authRouter);
app.use('/v1/users', userRouter);
app.use('/v1/babies', babyRouter);
app.use('/v1/blogs', blogRouter);
app.use('/v1/photos', photoRouter);
app.use('/v1/healthies', healthyRouter);
app.use('/v1/videos', videoRouter);

// 基础路由
app.get('/', (req, res) => {
  return sendSuccess(res, null, {
    message: 'BabyLog API服务正在运行'
  });
});

// 处理404路由
app.use((req, res, next) => {
  if (!req.route) {
    return sendError(req, res, 404, '请求的API路径不存在');
  }
  next();
});

// 错误处理中间件
app.use((err, req, res, next) => {
  return sendError(req, res, 500, '服务器内部错误', err);
});

// 启动服务器
const PORT = process.env.PORT || 8888;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在 http://0.0.0.0:${PORT}`);
});
