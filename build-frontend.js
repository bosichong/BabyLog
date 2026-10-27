const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('开始构建前端项目...');

const frontendPath = path.join(__dirname, 'web_v2');

// 构建Vite项目
console.log('\n开始构建Vite前端项目...');
try {
  execSync('npm run build', { cwd: frontendPath, stdio: 'inherit' });
  console.log('Vite前端项目构建成功！');
} catch (error) {
  console.error('Vite前端项目构建失败:', error.message);
  process.exit(1);
}

const distIndex = path.join(frontendPath, 'dist', 'index.html');
if (!fs.existsSync(distIndex)) {
  console.error('构建完成但未找到 dist/index.html，请检查前端构建配置');
  process.exit(1);
}

console.log('\n前端项目构建完成！');
console.log('前端构建产物位于 web_v2/dist，可以通过 node start.js 启动服务');
