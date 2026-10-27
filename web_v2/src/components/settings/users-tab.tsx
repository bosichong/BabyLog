import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { userAPI } from '@/lib/api'
import Modal from '@/components/modal'
import type { User } from '@/types'

const EMPTY = {
  username: '',
  password: '',
  family_member: '',
  gender: 'male',
  is_active: true,
}

const inputClass =
  'w-full min-w-0 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-500/20'

export default function UsersTab() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setUsers(await userAPI.list())
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取用户列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...EMPTY })
    setFormError('')
    setOpen(true)
  }

  const openEdit = (user: User) => {
    setEditing(user)
    setForm({
      username: user.username ?? '',
      password: '',
      family_member: user.family_member ?? '',
      gender: user.gender ?? 'male',
      is_active: user.is_active ?? true,
    })
    setFormError('')
    setOpen(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saving) return

    if (!form.username.trim()) return setFormError('请输入用户名')
    if (!editing && !form.password) return setFormError('请输入密码')

    setSaving(true)
    setFormError('')
    try {
      if (editing) {
        const payload: Record<string, unknown> = {
          username: form.username.trim(),
          family_member: form.family_member.trim(),
          gender: form.gender,
          is_active: form.is_active,
        }
        if (form.password) payload.password = form.password
        await userAPI.update(editing.id, payload)
      } else {
        await userAPI.create({
          username: form.username.trim(),
          password: form.password,
          family_member: form.family_member.trim(),
          gender: form.gender,
          is_active: form.is_active,
        })
      }
      setOpen(false)
      load()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (user: User) => {
    if (!window.confirm(`确定要删除用户「${user.username}」吗？`)) return
    try {
      await userAPI.remove(user.id)
      load()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : '删除失败')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">用户管理</h2>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1 rounded-xl bg-green-600 px-3 py-1.5 text-sm font-medium text-white"
        >
          <Plus size={15} />
          添加用户
        </button>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-neutral-500 dark:text-neutral-400">加载中...</p>
      ) : error ? (
        <p className="py-10 text-center text-sm text-red-500 dark:text-red-400">{error}</p>
      ) : (
        <div className="space-y-2">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 rounded-2xl bg-white dark:bg-neutral-900 p-3 ring-1 ring-neutral-200 dark:ring-neutral-800"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900 text-sm font-semibold text-green-700 dark:text-green-300">
                {user.family_member?.slice(0, 1) ?? user.username.slice(0, 1)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {user.family_member || '未设置'}
                  <span className="ml-1.5 text-xs font-normal text-neutral-400 dark:text-neutral-500">
                    {user.username}
                  </span>
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                  {user.gender === 'male' ? '男' : '女'}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                      user.is_active
                        ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                        : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                    }`}
                  >
                    {user.is_active ? '启用' : '禁用'}
                  </span>
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => openEdit(user)}
                  className="rounded-lg p-1.5 text-neutral-400 dark:text-neutral-500 hover:bg-green-50 dark:hover:bg-green-950 hover:text-green-600 dark:hover:text-green-400"
                  aria-label="编辑"
                >
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(user)}
                  className="rounded-lg p-1.5 text-neutral-400 dark:text-neutral-500 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400"
                  aria-label="删除"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <p className="rounded-2xl bg-white dark:bg-neutral-900 py-10 text-center text-sm text-neutral-500 dark:text-neutral-400 ring-1 ring-neutral-200 dark:ring-neutral-800">
              暂无用户
            </p>
          )}
        </div>
      )}

      <Modal
        open={open}
        title={editing ? '编辑用户' : '添加用户'}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={save} className="space-y-3">
          <div className="space-y-1">
            <label htmlFor="u-username" className="text-xs font-medium text-neutral-600 dark:text-neutral-400">用户名</label>
            <input id="u-username" className={inputClass} value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label htmlFor="u-password" className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
              密码{editing && <span className="ml-1 text-neutral-400 dark:text-neutral-500">（留空表示不修改）</span>}
            </label>
            <input id="u-password" type="password" className={inputClass} value={form.password}
              placeholder={editing ? '不修改请留空' : ''}
              onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label htmlFor="u-family" className="text-xs font-medium text-neutral-600 dark:text-neutral-400">家庭成员称呼</label>
            <input id="u-family" className={inputClass} value={form.family_member}
              placeholder="例如：爸爸"
              onChange={(e) => setForm({ ...form, family_member: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="u-gender" className="text-xs font-medium text-neutral-600 dark:text-neutral-400">性别</label>
              <select id="u-gender" className={inputClass} value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option value="male">男</option>
                <option value="female">女</option>
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="u-active" className="text-xs font-medium text-neutral-600 dark:text-neutral-400">状态</label>
              <select id="u-active" className={inputClass}
                value={form.is_active ? '1' : '0'}
                onChange={(e) => setForm({ ...form, is_active: e.target.value === '1' })}>
                <option value="1">启用</option>
                <option value="0">禁用</option>
              </select>
            </div>
          </div>

          {formError && <p className="text-xs text-red-500 dark:text-red-400">{formError}</p>}

          <button type="submit" disabled={saving}
            className="w-full rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            {saving ? '保存中...' : '保存'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
