import { Suspense } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import { BookOpen, Home, LogOut, Plus, Settings } from 'lucide-react'
import PageLoading from '@/components/page-loading'
import ThemeToggle from '@/components/theme-toggle'
import { auth } from '@/lib/auth'

const TABS = [
  { to: '/', label: '首页', icon: Home, end: true },
  { to: '/blogs', label: '日志', icon: BookOpen, end: true },
  { to: '/blogs/new', label: '添加', icon: Plus, end: true },
  { to: '/settings', label: '管理', icon: Settings, end: true },
] as const

export default function AppShell() {
  const navigate = useNavigate()
  const user = auth.getUser()

  const logout = () => {
    auth.clear()
    navigate('/login', { replace: true })
  }

  return (
    <div className="mx-auto min-h-dvh w-full max-w-[var(--app-max-width)] bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      {/* ---------- 顶部栏：当前用户 + 退出登录 ---------- */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 px-4 py-2 backdrop-blur-md sm:px-6 lg:px-8">
        <span className="min-w-0 truncate text-sm font-medium">
          {user?.family_member ?? '未登录'}
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          <ThemeToggle />
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1 rounded-lg bg-neutral-100 px-2.5 py-1.5 text-xs font-medium text-neutral-600 active:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:active:bg-neutral-700"
          >
            <LogOut size={13} />
            退出
          </button>
        </div>
      </header>

      {/* ---------- 内容区 ---------- */}
      <main className="px-4 pb-24 pt-4 sm:px-6 lg:px-8">
        <Suspense fallback={<PageLoading />}>
          <Outlet />
        </Suspense>
      </main>

      {/* ---------- 底部 Tab ---------- */}
      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[var(--app-max-width)] border-t border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md">
        <div className="grid grid-cols-4 pb-[env(safe-area-inset-bottom)]">
          {TABS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                  isActive ? 'text-green-600 dark:text-green-400' : 'text-neutral-500 dark:text-neutral-400'
                }`
              }
            >
              <Icon size={22} />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
