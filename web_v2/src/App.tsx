import { lazy, Suspense } from 'react'
import type { ReactElement } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router'
import AppShell from '@/components/layout/app-shell'
import PageLoading from '@/components/page-loading'
import { auth } from '@/lib/auth'

// 按路由拆包：首屏只加载当前页，图表等重依赖不进主 chunk
const HomePage = lazy(() => import('@/pages/home'))
const BlogsPage = lazy(() => import('@/pages/blogs'))
const BlogNewPage = lazy(() => import('@/pages/blog-new'))
const BlogEditPage = lazy(() => import('@/pages/blog-edit'))
const SettingsPage = lazy(() => import('@/pages/settings'))
const LoginPage = lazy(() => import('@/pages/login'))
const RegisterPage = lazy(() => import('@/pages/register'))

function RequireAuth({ children }: { children: ReactElement }) {
  const location = useLocation()
  if (!auth.isLoggedIn()) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <Suspense fallback={<PageLoading full />}>
              <LoginPage />
            </Suspense>
          }
        />
        <Route
          path="/register"
          element={
            <Suspense fallback={<PageLoading full />}>
              <RegisterPage />
            </Suspense>
          }
        />

        <Route
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="blogs" element={<BlogsPage />} />
          <Route path="blogs/new" element={<BlogNewPage />} />
          <Route path="blogs/:id/edit" element={<BlogEditPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
