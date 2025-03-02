const { spawn } = require('child_process');
const path = require('path');

// 获取命令行参数
const args = process.argv.slice(2);
const isDev = args.includes('--dev');

// 设置环境变量
process.env.NODE_ENV = isDev ? 'development' : 'production';

console.log(`启动模式: ${isDev ? '开发环境' : '生产环境'}`);

// 启动后端服务
function startBackend() {
  const backendPath = path.join(__dirname, 'express_back');
  const backendScript = isDev ? 'dev' : 'start';
  
  console.log(`启动后端服务 (${backendScript})...`);
  const backend = spawn('npm', ['run', backendScript], {
    cwd: backendPath,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      PORT: 8888
    }
  });

  backend.on('error', (err) => {
    console.error('后端服务启动失败:', err);
    process.exit(1);
  });

  return backend;
}

// 启动前端服务
function startFrontend() {
  const frontendPath = path.join(__dirname, 'nextjs_web');
  const frontendScript = isDev ? 'dev' : 'start';

  console.log(`启动前端服务 (${frontendScript})...`);
  const frontend = spawn('npm', ['run', frontendScript], {
    cwd: frontendPath,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      PORT: 3000
    }
  });

  frontend.on('error', (err) => {
    console.error('前端服务启动失败:', err);
    process.exit(1);
  });

  return frontend;
}

// 优雅地处理进程退出
function handleExit(backend, frontend) {
  process.on('SIGINT', () => {
    console.log('\n正在关闭服务...');
    backend.kill();
    frontend.kill();
  });

  process.on('SIGTERM', () => {
    console.log('\n正在关闭服务...');
    backend.kill();
    frontend.kill();
  });
}

// 主函数
function main() {
  try {
    const backend = startBackend();
    const frontend = startFrontend();

    console.log('\n服务启动成功！');
    console.log('- 后端API服务运行在: http://localhost:8888');
    console.log('- 前端服务运行在: http://localhost:3000');

    handleExit(backend, frontend);
  } catch (error) {
    console.error('服务启动失败:', error);
    process.exit(1);
  }
}

main();