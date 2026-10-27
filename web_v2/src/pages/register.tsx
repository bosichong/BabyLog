import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { authAPI } from '@/lib/api'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    family_member: '',
    gender: 'male',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState('')

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    if (!form.username.trim()) return setError('请输入用户名')
    if (!form.password) return setError('请输入密码')
    if (form.password !== form.confirmPassword) return setError('两次输入的密码不一致')

    setLoading(true)
    setError('')
    try {
      const res = await authAPI.register({
        username: form.username.trim(),
        password: form.password,
        family_member: form.family_member.trim() || '默认成员',
        gender: form.gender,
      })
      setDone(res.message || '注册成功，请等待管理员审核激活')
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full min-w-0 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3.5 py-2.5 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-500/20'

  return (
    <div className="flex min-h-dvh items-center justify-center overflow-x-hidden bg-neutral-50 dark:bg-neutral-950 px-5 py-10">
      <div className="w-full max-w-sm min-w-0">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">注册账户</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">创建新的家庭成员账号</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="username" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">用户名</label>
            <input id="username" className={inputClass} placeholder="用户名" autoComplete="username"
              value={form.username} onChange={update('username')} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">密码</label>
            <input id="password" type="password" className={inputClass} placeholder="密码"
              autoComplete="new-password" value={form.password} onChange={update('password')} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">确认密码</label>
            <input id="confirmPassword" type="password" className={inputClass} placeholder="再次输入密码"
              autoComplete="new-password" value={form.confirmPassword} onChange={update('confirmPassword')} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="family_member" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">家庭成员称呼</label>
            <input id="family_member" className={inputClass} placeholder="例如：爸爸、妈妈"
              value={form.family_member} onChange={update('family_member')} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="gender" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">性别</label>
            <select id="gender" className={inputClass} value={form.gender} onChange={update('gender')}>
              <option value="male">男</option>
              <option value="female">女</option>
            </select>
          </div>

          {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
          {done && <p className="text-sm text-green-600 dark:text-green-400">{done}</p>}

          <button type="submit" disabled={loading}
            className="w-full rounded-xl bg-green-600 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50">
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
          已有账户？
          <Link to="/login" className="ml-1 font-medium text-green-600 dark:text-green-400">立即登录</Link>
        </p>
      </div>
    </div>
  )
}
