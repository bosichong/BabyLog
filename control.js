const { exec, spawn } = require('child_process');
const path = require('path');
const { stopAll } = require('./stop');

// 检查服务是否在运行
function checkServices() {
  return new Promise((resolve) => {
    exec('lsof -ti:8888,3000 2>/dev/null', (error, stdout) => {
      const pids = stdout.trim().split('\n').filter(Boolean);
      resolve(pids.length > 0);
    });
  });
}

// 启动服务（复用 start.js，统一进程管理和 PID 文件）
function startServices() {
  console.log('启动 BabyLog 服务...\n');

  const child = spawn(process.execPath, [path.join(__dirname, 'start.js')], {
    stdio: 'inherit',
    env: process.env
  });

  child.on('error', (err) => {
    console.error('服务启动失败:', err);
    process.exit(1);
  });

  child.on('exit', (code) => {
    process.exit(code ?? 0);
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
        stopAll();
        process.exit(0);
      } else if (answer === '2') {
        console.log('正在停止现有服务...\n');
        stopAll();
        setTimeout(() => startServices(), 1000);
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
