import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { Button } from '@heroui/react'
import { authAPI, userAPI } from '@/lib/api'
import { auth } from '@/lib/auth'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: string } }
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
  e.preventDefault()
  if (loading) return

  const name = username.trim()
  if (!name) {
    setError('请输入用户名')
    return
  }
  if (!password) {
    setError('请输入密码')
    return
  }

  setLoading(true)
  setError('')

  try {
    const { access_token } = await authAPI.login(name, password)
      // 先落 token 才能拉用户信息
      localStorage.setItem('bl_token', access_token)
      try {
        const users = await userAPI.list()
        const me = users.find((u) => u.username === name)
        auth.save(
          access_token,
          me
            ? { id: me.id, username: me.username, family_member: me.family_member, gender: me.gender }
            : undefined,
        )
      } catch {
        auth.save(access_token)
      }
      navigate(location.state?.from ?? '/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center overflow-x-hidden bg-neutral-50 dark:bg-neutral-950 px-5">
      <div className="w-full max-w-sm min-w-0">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">宝贝日记</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">记录孩子成长的每一天</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="username" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              用户名
            </label>
            <input
              id="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full min-w-0 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3.5 py-2.5 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-500/20"
              placeholder="用户名"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              密码
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full min-w-0 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3.5 py-2.5 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-500/20"
              placeholder="密码"
            />
          </div>

          {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

          <Button type="submit" fullWidth isPending={loading} size="lg">
            登录
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
          还没有账户？
          <Link to="/register" className="ml-1 font-medium text-green-600 dark:text-green-400">
            注册
          </Link>
        </p>
      </div>
    </div>
  )
}
