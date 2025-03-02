const { execSync } = require('child_process');
const path = require('path');

console.log('开始构建前端项目...');

// 进入Next.js前端目录
process.chdir(path.join(__dirname, 'nextjs_web'));

// 构建Next.js项目
console.log('\n开始构建Next.js项目...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('Next.js项目构建成功！');
} catch (error) {
  console.error('Next.js项目构建失败:', error.message);
  process.exit(1);
}

console.log('\n前端项目构建完成！');
console.log('前端项目已成功构建，可以通过npm run start启动服务');