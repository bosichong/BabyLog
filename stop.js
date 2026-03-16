const { execSync } = require('child_process');

console.log('正在停止 BabyLog 服务...\n');

// 停止后端服务 (端口 8888)
try {
  const backendPids = execSync('lsof -ti:8888 2>/dev/null', { encoding: 'utf8' }).trim();
  if (backendPids) {
    execSync(`kill -9 ${backendPids}`, { encoding: 'utf8' });
    console.log('✓ 后端服务已停止 (端口 8888)');
  } else {
    console.log('后端服务未运行');
  }
} catch (error) {
  console.log('后端服务未运行或已停止');
}

// 停止前端服务 (端口 3000-3010，防止端口自动切换)
try {
  const frontendPids = execSync('lsof -ti:3000,3001,3002,3003,3004,3005 2>/dev/null', { encoding: 'utf8' }).trim();
  if (frontendPids) {
    execSync(`kill -9 ${frontendPids}`, { encoding: 'utf8' });
    console.log('✓ 前端服务已停止 (端口 3000-3010)');
  } else {
    console.log('前端服务未运行');
  }
} catch (error) {
  console.log('前端服务未运行或已停止');
}

console.log('\n所有服务已关闭！');