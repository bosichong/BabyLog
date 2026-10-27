const { execSync } = require('child_process');
const path = require('path');

console.log('开始安装所有依赖...');

const targets = [
  { name: '根目录', dir: __dirname },
  { name: 'Express后端', dir: path.join(__dirname, 'express_back') },
  { name: 'Vite前端', dir: path.join(__dirname, 'web_v2') },
];

for (const target of targets) {
  console.log(`\n正在安装${target.name}依赖...`);
  try {
    execSync('npm install', { cwd: target.dir, stdio: 'inherit' });
    console.log(`${target.name}依赖安装完成！`);
  } catch (error) {
    console.error(`${target.name}依赖安装失败:`, error.message);
    process.exit(1);
  }
}

console.log('\n所有依赖安装完成！');
console.log('请运行 npm run build 构建前端，然后运行 node start.js 启动服务');
