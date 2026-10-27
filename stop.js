const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const pidFile = path.join(__dirname, 'logs', 'babylog.pid');
const BACKEND_PORT = 8888;
const FRONTEND_PORTS = Array.from({ length: 11 }, (_, i) => 3000 + i); // 3000-3010

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

// 先结束后代进程，再结束主进程，避免 nodemon/vite 变成孤儿进程
function killTree(pid) {
  for (const childPid of listDescendants(pid)) {
    try {
      process.kill(childPid, 'SIGTERM');
    } catch {
      // 进程可能已退出
    }
  }
  try {
    process.kill(pid, 'SIGTERM');
  } catch {
    // 进程可能已退出
  }
}

// 确认 PID 确实属于 start.js，避免 PID 被系统复用后误杀其他进程
function isStartProcess(pid) {
  try {
    const command = execSync(`ps -p ${pid} -o args=`, { encoding: 'utf8' }).trim();
    return command.includes('start.js');
  } catch {
    return false;
  }
}

// 清理通过 start.js 启动的整棵进程树
function stopByPidFile() {
  if (!fs.existsSync(pidFile)) return false;

  const pid = Number(fs.readFileSync(pidFile, 'utf8').trim());
  try {
    fs.unlinkSync(pidFile);
  } catch {
    // 忽略清理失败
  }

  if (!pid || pid === process.pid || !isAlive(pid) || !isStartProcess(pid)) {
    return false;
  }

  killTree(pid);
  console.log(`✓ BabyLog 主进程已停止 (PID: ${pid})`);
  return true;
}

// 作为兜底，清理直接占用端口的进程
function stopByPorts(ports, label, quiet = false) {
  try {
    const pids = execSync(`lsof -ti:${ports.join(',')} 2>/dev/null`, {
      encoding: 'utf8'
    }).trim();

    if (!pids) {
      if (!quiet) console.log(`${label}未运行`);
      return;
    }

    execSync(`kill -9 ${pids.split(/\s+/).join(' ')}`, { encoding: 'utf8' });
    const portRange =
      ports.length > 1 ? `${ports[0]}-${ports[ports.length - 1]}` : String(ports[0]);
    console.log(`✓ ${label}已停止 (端口 ${portRange})`);
  } catch {
    if (!quiet) console.log(`${label}未运行或已停止`);
  }
}

function stopAll() {
  console.log('正在停止 BabyLog 服务...\n');

  const stoppedByPid = stopByPidFile();

  stopByPorts([BACKEND_PORT], '后端服务', stoppedByPid);
  stopByPorts(FRONTEND_PORTS, '前端服务', stoppedByPid);

  console.log('\n所有服务已关闭！');
}

if (require.main === module) {
  stopAll();
}

module.exports = { stopAll };
