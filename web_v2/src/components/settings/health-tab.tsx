import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { babyAPI, healthAPI } from '@/lib/api'
import { formatShortDate } from '@/lib/utils'
import Modal from '@/components/modal'
import type { Baby, HealthRecord } from '@/types'

const inputClass =
  'w-full min-w-0 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-500/20'

export default function HealthTab() {
  const [babies, setBabies] = useState<Baby[]>([])
  const [records, setRecords] = useState<HealthRecord[]>([])
  const [filterBaby, setFilterBaby] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<HealthRecord | null>(null)
  const [form, setForm] = useState({ baby_id: '', height: '', weight: '' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const loadRecords = async (babyId: number | null) => {
    setLoading(true)
    setError('')
    try {
      const data = await healthAPI.list(babyId ? [babyId] : undefined)
      setRecords(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取健康记录失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const init = async () => {
      try {
        const list = await babyAPI.list()
        setBabies(list)
        if (list.length > 0) setForm((f) => ({ ...f, baby_id: String(list[0].id) }))
      } catch {
        /* 宝宝列表失败不影响记录展示 */
      }
      await loadRecords(null)
    }
    init()
  }, [])

  const changeFilter = (id: number | null) => {
    setFilterBaby(id)
    loadRecords(id)
  }

  const openCreate = () => {
    setEditing(null)
    setForm({
      baby_id: filterBaby ? String(filterBaby) : babies[0] ? String(babies[0].id) : '',
      height: '',
      weight: '',
    })
    setFormError('')
    setOpen(true)
  }

  const openEdit = (record: HealthRecord) => {
    setEditing(record)
    setForm({
      baby_id: String(record.baby_id ?? record.Baby?.id ?? ''),
      height: record.height != null ? String(record.height) : '',
      weight: record.weight != null ? String(record.weight) : '',
    })
    setFormError('')
    setOpen(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saving) return

    if (!editing && !form.baby_id) return setFormError('请选择宝宝')
    if (!form.height.trim() || !form.weight.trim()) return setFormError('身高和体重都要填写')

    const height = Number(form.height)
    const weight = Number(form.weight)
    if (Number.isNaN(height) || Number.isNaN(weight)) return setFormError('请输入有效的数字')
    if (height <= 0 || weight <= 0) return setFormError('身高和体重必须大于 0')

    setSaving(true)
    setFormError('')
    try {
      if (editing) {
        await healthAPI.update(editing.id, { height, weight })
      } else {
        await healthAPI.create({ baby_id: Number(form.baby_id), height, weight })
      }
      setOpen(false)
      loadRecords(filterBaby)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (record: HealthRecord) => {
    if (!window.confirm('确定要删除这条健康记录吗？')) return
    try {
      await healthAPI.remove(record.id)
      loadRecords(filterBaby)
    } catch (err) {
      window.alert(err instanceof Error ? err.message : '删除失败')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">健康数据</h2>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1 rounded-xl bg-green-600 px-3 py-1.5 text-sm font-medium text-white"
        >
          <Plus size={15} />
          添加记录
        </button>
      </div>

      {babies.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => changeFilter(null)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              filterBaby === null
                ? 'bg-green-600 text-white'
                : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 ring-1 ring-neutral-200 dark:ring-neutral-800'
            }`}
          >
            全部
          </button>
          {babies.map((baby) => (
            <button
              key={baby.id}
              type="button"
              onClick={() => changeFilter(baby.id)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                filterBaby === baby.id
                  ? 'bg-green-600 text-white'
                  : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 ring-1 ring-neutral-200 dark:ring-neutral-800'
              }`}
            >
              {baby.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="py-10 text-center text-sm text-neutral-500 dark:text-neutral-400">加载中...</p>
      ) : error ? (
        <p className="py-10 text-center text-sm text-red-500 dark:text-red-400">{error}</p>
      ) : (
        <div className="space-y-2">
          {records.map((record) => (
            <div
              key={record.id}
              className="flex items-center gap-3 rounded-2xl bg-white dark:bg-neutral-900 p-3 ring-1 ring-neutral-200 dark:ring-neutral-800"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {record.Baby?.name ?? '未知宝宝'}
                  <span className="ml-2 text-xs font-normal text-neutral-400 dark:text-neutral-500">
                    {formatShortDate(record.created_at)}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-neutral-600 dark:text-neutral-400">
                  身高 <span className="font-semibold text-neutral-900 dark:text-neutral-100">{record.height ?? '-'}</span> cm
                  <span className="mx-1.5 text-neutral-300">·</span>
                  体重 <span className="font-semibold text-neutral-900 dark:text-neutral-100">{record.weight ?? '-'}</span> kg
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => openEdit(record)}
                  className="rounded-lg p-1.5 text-neutral-400 dark:text-neutral-500 hover:bg-green-50 dark:hover:bg-green-950 hover:text-green-600 dark:hover:text-green-400"
                  aria-label="编辑"
                >
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(record)}
                  className="rounded-lg p-1.5 text-neutral-400 dark:text-neutral-500 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400"
                  aria-label="删除"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
          {records.length === 0 && (
            <p className="rounded-2xl bg-white dark:bg-neutral-900 py-10 text-center text-sm text-neutral-500 dark:text-neutral-400 ring-1 ring-neutral-200 dark:ring-neutral-800">
              暂无健康记录
            </p>
          )}
        </div>
      )}

      <Modal
        open={open}
        title={editing ? '编辑健康记录' : '添加健康记录'}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={save} className="space-y-3">
          {!editing && (
            <div className="space-y-1">
              <label htmlFor="h-baby" className="text-xs font-medium text-neutral-600 dark:text-neutral-400">宝宝</label>
              <select
                id="h-baby"
                className={inputClass}
                value={form.baby_id}
                onChange={(e) => setForm({ ...form, baby_id: e.target.value })}
              >
                {babies.map((baby) => (
                  <option key={baby.id} value={baby.id}>
                    {baby.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="h-height" className="text-xs font-medium text-neutral-600 dark:text-neutral-400">身高 (cm)</label>
              <input
                id="h-height"
                type="number"
                step="0.1"
                inputMode="decimal"
                className={inputClass}
                value={form.height}
                placeholder="例如 75.5"
                onChange={(e) => setForm({ ...form, height: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="h-weight" className="text-xs font-medium text-neutral-600 dark:text-neutral-400">体重 (kg)</label>
              <input
                id="h-weight"
                type="number"
                step="0.1"
                inputMode="decimal"
                className={inputClass}
                value={form.weight}
                placeholder="例如 9.2"
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
              />
            </div>
          </div>

          {formError && <p className="text-xs text-red-500 dark:text-red-400">{formError}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
