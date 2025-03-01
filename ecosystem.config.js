module.exports = {
  apps: [
    {
      name: 'babylog-backend',
      script: './express_back/app.js',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 8888
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log'
    },
    {
      name: 'babylog-frontend',
      // 使用 node 而不是 npm 来启动
      script: 'node',
      // 直接调用 next 的启动脚本
      args: './node_modules/next/dist/bin/next',
      cwd: './nextjs_web',
      watch: false,
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log'
    }
  ]
};