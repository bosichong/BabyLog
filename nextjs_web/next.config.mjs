/** @type {import('next').NextConfig} */
const nextConfig = {
  // 禁用图片优化
  images: {
    unoptimized: true
  },
  // 设置基础路径
  basePath: '',
  // 禁用默认的X-Powered-By头
  poweredByHeader: false,
  // 禁用默认的严格模式
  reactStrictMode: false
};

export default nextConfig;
