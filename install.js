const { execSync } = require('child_process');
const path = require('path');

console.log('开始安装所有依赖...');

// 安装根目录依赖
console.log('\n正在安装根目录依赖...');
try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('根目录依赖安装完成！');
} catch (error) {
    console.error('根目录依赖安装失败:', error.message);
}

// 安装Express后端依赖
console.log('\n正在安装Express后端依赖...');
try {
    process.chdir(path.join(__dirname, 'express_back'));
    execSync('npm install', { stdio: 'inherit' });
    console.log('Express后端依赖安装完成！');
} catch (error) {
    console.error('Express后端依赖安装失败:', error.message);
}

// 安装Next.js前端依赖
console.log('\n正在安装Next.js前端依赖...');
try {
    process.chdir(path.join(__dirname, 'nextjs_web'));
    execSync('npm install', { stdio: 'inherit' });
    console.log('Next.js前端依赖安装完成！');
} catch (error) {
    console.error('Next.js前端依赖安装失败:', error.message);
}

console.log('\n所有依赖安装完成！');