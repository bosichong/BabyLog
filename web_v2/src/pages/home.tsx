import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Plus } from 'lucide-react'
import { babyAPI, blogAPI } from '@/lib/api'
import { calcAge, formatFullDate, formatTimeAgo, stripHtml } from '@/lib/utils'
import GrowthChart from '@/components/growth-chart'
import MediaGallery from '@/components/media-gallery'
import type { Baby, Blog } from '@/types'

export default function HomePage() {
  const [babies, setBabies] = useState<Baby[]>([])
  const [memories, setMemories] = useState<Blog[]>([])
  const [activeBaby, setActiveBaby] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const list = await babyAPI.list()
        const withCounts = await Promise.all(
          list.map(async (baby) => {
            try {
              const { count } = await babyAPI.blogCount(baby.id)
              return { ...baby, records_count: count }
            } catch {
              return { ...baby, records_count: 0 }
            }
          }),
        )
        setBabies(withCounts)
        if (withCounts.length > 0) setActiveBaby(withCounts[0].id)

        const mem = await blogAPI.memoriesToday()
        setMemories(mem ?? [])
      } catch {
        setError('获取数据失败')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const current = babies.find((b) => b.id === activeBaby)

  if (loading) {
    return <div className="py-16 text-center text-sm text-neutral-500 dark:text-neutral-400">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold tracking-tight">今天</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{formatFullDate(new Date())}</p>
      </header>

      {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

      {/* ---------- 宝宝卡片 + 生长曲线 ---------- */}
      {babies.length > 0 ? (
        <section className="space-y-3">
          {babies.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {babies.map((baby) => (
                <button
                  key={baby.id}
                  type="button"
                  onClick={() => setActiveBaby(baby.id)}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    activeBaby === baby.id
                      ? 'bg-green-600 text-white'
                      : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 ring-1 ring-neutral-200 dark:ring-neutral-800'
                  }`}
                >
                  {baby.name}
                </button>
              ))}
            </div>
          )}

          {current && (
            <div className="overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800">
              <div className="border-b border-neutral-100 dark:border-neutral-800 p-4">
                <h2 className="text-base font-semibold">{current.name}</h2>
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-neutral-600 dark:text-neutral-400">
                  <p>出生于 {current.birthday}</p>
                  <p>{calcAge(current.birthday).years} 岁</p>
                  <p>已出生 {calcAge(current.birthday).days} 天</p>
                  <p>共 {current.records_count ?? 0} 条记录</p>
                </div>
              </div>
              <div className="p-2">
                <GrowthChart babyId={current.id} />
              </div>
            </div>
          )}
        </section>
      ) : (
        <p className="rounded-2xl bg-white dark:bg-neutral-900 p-6 text-center text-sm text-neutral-500 dark:text-neutral-400 ring-1 ring-neutral-200 dark:ring-neutral-800">
          暂无宝宝信息，去「管理」里添加
        </p>
      )}

      {/* ---------- 往年今日 ---------- */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">往年今日</h2>

        {memories.length > 0 ? (
          <div className="space-y-3">
            {memories.map((memory) => {
              const postDate = new Date(memory.created_at)
              const yearsAgo = Number.isNaN(postDate.getTime())
                ? 0
                : new Date().getFullYear() - postDate.getFullYear()
              return (
                <article
                  key={memory.id}
                  className="overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800"
                >
                  <div className="border-b border-neutral-100 dark:border-neutral-800 px-4 py-2.5">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {memory.user?.family_member ?? '家人'}:在{' '}
                      <span title={formatFullDate(memory.created_at)} className="font-medium">
                        {yearsAgo}年前
                      </span>{' '}
                      添加了一条
                      {memory.babies && memory.babies.length > 0
                        ? `关于${memory.babies.map((b) => b.name).join('、')}`
                        : ''}
                      数据
                      <span className="ml-2 text-neutral-400 dark:text-neutral-500">
                        {formatTimeAgo(memory.created_at)}前
                      </span>
                    </p>
                  </div>
                  <div className="p-4">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                      {stripHtml(memory.content)}
                    </p>
                    <MediaGallery photos={memory.photos} video={memory.video} />
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="rounded-2xl bg-white dark:bg-neutral-900 p-8 text-center ring-1 ring-neutral-200 dark:ring-neutral-800">
            <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">往年的今天还没有数据，不如现在添加一条吧！</p>
            <Link
              to="/blogs/new"
              className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white"
            >
              <Plus size={16} />
              添加日志
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
