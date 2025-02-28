require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Sequelize } = require('sequelize');
const initModels = require('./models/init-models');

const app = express();

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
    console.log('请求体:', JSON.stringify(req.body, null, 2));
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

// 配置静态文件目录
app.use('/uploads', express.static('uploads'));

// 数据库连接配置
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'babylog_data.db',
  logging: false
});

// 初始化数据库模型
const models = initModels(sequelize);

// 测试数据库连接
sequelize.authenticate()
  .then(() => {
    console.log('数据库连接成功');
    // 同步数据库模型
    return sequelize.sync();
  })
  .then(() => {
    console.log('数据库模型同步成功');
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

// 注册路由
app.use('/v1/auth', authRouter);
app.use('/v1/users', userRouter);
app.use('/v1/babies', babyRouter);
app.use('/v1/blogs', blogRouter);
app.use('/v1/photos', photoRouter);
app.use('/v1/healthies', healthyRouter);

// 基础路由
app.get('/', (req, res) => {
  res.json({ message: 'BabyLog API 服务运行正常' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: '服务器内部错误'
  });
});

// 启动服务器
const PORT = process.env.PORT || 8887;
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
