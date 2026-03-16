const { exec } = require('child_process');
const { spawn } = require('child_process');
const path = require('path');

// 检查服务是否在运行
function checkServices() {
  return new Promise((resolve) => {
    exec('lsof -ti:8888,3000 2>/dev/null', (error, stdout) => {
      const pids = stdout.trim().split('\n').filter(Boolean);
      resolve(pids.length > 0);
    });
  });
}

// 停止服务
function stopServices() {
  console.log('正在停止 BabyLog 服务...\n');

  exec('lsof -ti:8888 | xargs kill -9 2>/dev/null', (error) => {
    if (error) {
      console.log('后端服务未运行');
    } else {
      console.log('✓ 后端服务已停止');
    }

    exec('lsof -ti:3000 | xargs kill -9 2>/dev/null', (error) => {
      if (error) {
        console.log('前端服务未运行');
      } else {
        console.log('✓ 前端服务已停止');
      }

      console.log('\n所有服务已关闭！');
      process.exit(0);
    });
  });
}

// 启动服务
function startServices() {
  console.log('启动 BabyLog 服务...\n');
  const backendPath = path.join(__dirname, 'express_back');
  const frontendPath = path.join(__dirname, 'nextjs_web');

  const backend = spawn('npm', ['run', 'start'], {
    cwd: backendPath,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, PORT: 8888 }
  });

  const frontend = spawn('npm', ['run', 'start'], {
    cwd: frontendPath,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, PORT: 3000 }
  });

  backend.on('error', (err) => {
    console.error('后端服务启动失败:', err);
    process.exit(1);
  });

  frontend.on('error', (err) => {
    console.error('前端服务启动失败:', err);
    process.exit(1);
  });

  console.log('\n服务启动成功！');
  console.log('- 后端API服务运行在: http://localhost:8888');
  console.log('- 前端服务运行在: http://localhost:3000');
  console.log('\n按 Ctrl+C 停止服务\n');

  process.on('SIGINT', () => {
    console.log('\n正在关闭服务...');
    backend.kill();
    frontend.kill();
    process.exit(0);
  });
}

// 主逻辑
async function main() {
  const isRunning = await checkServices();

  if (isRunning) {
    console.log('检测到服务正在运行');
    console.log('1. 停止服务');
    console.log('2. 重新启动服务\n');

    // 使用 readline 读取用户输入
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('请选择操作 (1/2): ', (answer) => {
      rl.close();
      if (answer === '1') {
        stopServices();
      } else if (answer === '2') {
        console.log('正在停止现有服务...\n');
        exec('lsof -ti:8888,3000 | xargs kill -9 2>/dev/null', () => {
          setTimeout(() => startServices(), 1000);
        });
      } else {
        console.log('无效选择，退出');
        process.exit(0);
      }
    });
  } else {
    console.log('检测到服务未运行，正在启动...\n');
    startServices();
  }
}

main();