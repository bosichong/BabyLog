const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 获取命令行参数
const args = process.argv.slice(2);
const isDev = args.includes('--dev');

// 设置环境变量
process.env.NODE_ENV = isDev ? 'development' : 'production';

// 端口配置
const BACKEND_PORT = 8888;
const FRONTEND_PORT = 3000;

// Windows 下需要通过 shell 运行 npm
const useShell = process.platform === 'win32';

// 记录主进程 PID，供 stop.js 清理整棵进程树
const pidFile = path.join(__dirname, 'logs', 'babylog.pid');

function isAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

// 获取指定进程的所有后代进程
function listDescendants(pid) {
  try {
    const output = execSync('ps -eo pid=,ppid=', { encoding: 'utf8' });
    const children = new Map();
    for (const line of output.trim().split('\n')) {
      const [child, parent] = line.trim().split(/\s+/).map(Number);
      if (!Number.isInteger(child) || !Number.isInteger(parent)) continue;
      if (!children.has(parent)) children.set(parent, []);
      children.get(parent).push(child);
    }

    const result = [];
    const stack = [...(children.get(pid) || [])];
    while (stack.length > 0) {
      const current = stack.pop();
      result.push(current);
      stack.push(...(children.get(current) || []));
    }
    return result;
  } catch {
    return [];
  }
}

// 结束子进程及其所有后代（npm -> sh -> nodemon/vite -> node）
function killTree(child) {
  if (!child || !child.pid) return;

  if (process.platform === 'win32') {
    try {
      child.kill();
    } catch {
      // 进程可能已退出
    }
    return;
  }

  for (const pid of listDescendants(child.pid)) {
    try {
      process.kill(pid, 'SIGTERM');
    } catch {
      // 进程可能已退出
    }
  }
  try {
    child.kill('SIGTERM');
  } catch {
    // 进程可能已退出
  }
}

function writePidFile() {
  fs.mkdirSync(path.dirname(pidFile), { recursive: true });
  fs.writeFileSync(pidFile, String(process.pid));
}

function removePidFile() {
  try {
    if (fs.existsSync(pidFile)) fs.unlinkSync(pidFile);
  } catch {
    // 忽略清理失败
  }
}

function ensureNotRunning() {
  if (!fs.existsSync(pidFile)) return;

  const pid = Number(fs.readFileSync(pidFile, 'utf8').trim());
  if (pid && pid !== process.pid && isAlive(pid)) {
    console.error(`检测到 BabyLog 已在运行 (PID: ${pid})，请先运行 node stop.js`);
    process.exit(1);
  }
  removePidFile();
}

console.log(`启动模式: ${isDev ? '开发环境' : '生产环境'}`);

// 启动后端服务
function startBackend() {
  const backendPath = path.join(__dirname, 'express_back');
  const backendScript = isDev ? 'dev' : 'start';

  console.log(`启动后端服务 (${backendScript})...`);
  const backend = spawn('npm', ['run', backendScript], {
    cwd: backendPath,
    stdio: 'inherit',
    shell: useShell,
    env: {
      ...process.env,
      PORT: BACKEND_PORT
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
  const frontendPath = path.join(__dirname, 'web_v2');

  // 开发环境使用 Vite Dev Server（HMR），生产环境使用 Vite Preview
  // 两者都会复用 vite.config.ts 中的 proxy，把 /v1 和 /uploads 转发到后端
  const frontendScript = isDev ? 'dev' : 'preview';

  console.log(`启动前端服务 (${frontendScript})...`);
  const frontend = spawn(
    'npm',
    ['run', frontendScript, '--', '--port', String(FRONTEND_PORT), '--host'],
    {
      cwd: frontendPath,
      stdio: 'inherit',
      shell: useShell,
      env: { ...process.env }
    }
  );

  frontend.on('error', (err) => {
    console.error('前端服务启动失败:', err);
    process.exit(1);
  });

  return frontend;
}

// 生产环境启动前检查前端是否已构建
function ensureFrontendBuilt() {
  if (isDev) return;

  const distIndex = path.join(__dirname, 'web_v2', 'dist', 'index.html');
  if (!fs.existsSync(distIndex)) {
    console.error('未找到前端构建产物，请先运行 npm run build');
    process.exit(1);
  }
}

// 优雅地处理进程退出
function handleExit(backend, frontend) {
  let shuttingDown = false;

  const shutdown = () => {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log('\n正在关闭服务...');
    killTree(backend);
    killTree(frontend);
    removePidFile();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('exit', removePidFile);
}

// 主函数
function main() {
  try {
    ensureFrontendBuilt();
    ensureNotRunning();
    writePidFile();

    let backend;
    let frontend;

    // 异常退出时也确保子进程被回收
    process.on('exit', () => {
      killTree(backend);
      killTree(frontend);
    });

    backend = startBackend();
    frontend = startFrontend();

    console.log('\n服务启动成功！');
    console.log(`- 后端API服务运行在: http://localhost:${BACKEND_PORT}`);
    console.log(`- 前端服务运行在: http://localhost:${FRONTEND_PORT}`);

    handleExit(backend, frontend);
  } catch (error) {
    console.error('服务启动失败:', error);
    removePidFile();
    process.exit(1);
  }
}

main();
