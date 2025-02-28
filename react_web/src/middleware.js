import { NextResponse } from 'next/server';

export function middleware(request) {
  // 获取当前请求的路径
  const path = request.nextUrl.pathname;

  // 定义不需要验证的路由
  const publicPaths = [
    '/login',
    '/register',
    '/api/auth/token',
    '/api/auth/register'
  ];

  // 检查是否是公开路径
  const isPublicPath = publicPaths.some(publicPath => 
    path.startsWith(publicPath)
  );

  // 从请求头中获取token
  const token = request.cookies.get('token')?.value;

  // 如果是公开路径且已登录，重定向到首页
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 如果不是公开路径且未登录，重定向到登录页
  if (!isPublicPath && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', path);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// 配置中间件匹配的路由
export const config = {
  matcher: [
    /*
     * 匹配所有路径除了：
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};