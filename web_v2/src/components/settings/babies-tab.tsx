import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { babyAPI } from '@/lib/api'
import { calcAge } from '@/lib/utils'
import Modal from '@/components/modal'
import type { Baby } from '@/types'

const inputClass =
  'w-full min-w-0 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-500/20'

export default function BabiesTab() {
  const [babies, setBabies] = useState<Baby[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Baby | null>(null)
  const [form, setForm] = useState({ name: '', birthday: '' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setBabies(await babyAPI.list())
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取宝宝列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', birthday: '' })
    setFormError('')
    setOpen(true)
  }

  const openEdit = (baby: Baby) => {
    setEditing(baby)
    setForm({
      name: baby.name ?? '',
      birthday: (baby.birthday ?? '').slice(0, 10),
    })
    setFormError('')
    setOpen(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saving) return
    if (!form.name.trim()) return setFormError('请输入宝宝名字')
    if (!form.birthday) return setFormError('请选择出生日期')

    setSaving(true)
    setFormError('')
    try {
      if (editing) {
        await babyAPI.update(editing.id, {
          name: form.name.trim(),
          birthday: form.birthday,
        })
      } else {
        await babyAPI.create({ name: form.name.trim(), birthday: form.birthday })
      }
      setOpen(false)
      load()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (baby: Baby) => {
    if (!window.confirm(`确定要删除「${baby.name}」吗？相关记录可能一并受影响。`)) return
    try {
      await babyAPI.remove(baby.id)
      load()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : '删除失败')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">宝贝管理</h2>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1 rounded-xl bg-green-600 px-3 py-1.5 text-sm font-medium text-white"
        >
          <Plus size={15} />
          添加宝贝
        </button>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-neutral-500 dark:text-neutral-400">加载中...</p>
      ) : error ? (
        <p className="py-10 text-center text-sm text-red-500 dark:text-red-400">{error}</p>
      ) : (
        <div className="space-y-2">
          {babies.map((baby) => (
            <div
              key={baby.id}
              className="flex items-center gap-3 rounded-2xl bg-white dark:bg-neutral-900 p-3 ring-1 ring-neutral-200 dark:ring-neutral-800"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-900 text-sm font-semibold text-pink-600 dark:text-pink-300">
                {baby.name?.slice(0, 1) ?? '?'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{baby.name}</p>
                <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                  {baby.birthday} · {calcAge(baby.birthday).days} 天
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => openEdit(baby)}
                  className="rounded-lg p-1.5 text-neutral-400 dark:text-neutral-500 hover:bg-green-50 dark:hover:bg-green-950 hover:text-green-600 dark:hover:text-green-400"
                  aria-label="编辑"
                >
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(baby)}
                  className="rounded-lg p-1.5 text-neutral-400 dark:text-neutral-500 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400"
                  aria-label="删除"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
          {babies.length === 0 && (
            <p className="rounded-2xl bg-white dark:bg-neutral-900 py-10 text-center text-sm text-neutral-500 dark:text-neutral-400 ring-1 ring-neutral-200 dark:ring-neutral-800">
              还没有添加宝宝
            </p>
          )}
        </div>
      )}

      <Modal open={open} title={editing ? '编辑宝贝' : '添加宝贝'} onClose={() => setOpen(false)}>
        <form onSubmit={save} className="space-y-3">
          <div className="space-y-1">
            <label htmlFor="b-name" className="text-xs font-medium text-neutral-600 dark:text-neutral-400">名字</label>
            <input id="b-name" className={inputClass} value={form.name}
              placeholder="宝宝的名字"
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label htmlFor="b-birthday" className="text-xs font-medium text-neutral-600 dark:text-neutral-400">出生日期</label>
            <input id="b-birthday" type="date" className={inputClass} value={form.birthday}
              onChange={(e) => setForm({ ...form, birthday: e.target.value })} />
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
