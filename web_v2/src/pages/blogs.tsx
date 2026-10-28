import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Pencil, Search, Trash2 } from 'lucide-react'
import { blogAPI } from '@/lib/api'
import { formatFullDate, formatTimeAgo, stripHtml } from '@/lib/utils'
import MediaGallery from '@/components/media-gallery'
import type { Blog } from '@/types'

const PAGE_SIZE = 10

export default function BlogsPage() {
  const navigate = useNavigate()
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [keyword, setKeyword] = useState('')
  const [appliedKeyword, setAppliedKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await blogAPI.search({
        page,
        pageSize: PAGE_SIZE,
        keyword: appliedKeyword,
      })
      setBlogs(res.items ?? [])
      setTotal(res.total ?? 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取日志列表失败')
    } finally {
      setLoading(false)
    }
  }, [page, appliedKeyword])

  useEffect(() => {
    load()
  }, [load])

  const search = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    setAppliedKeyword(keyword.trim())
    window.scrollTo(0, 0)
  }

  const goToPage = (next: number) => {
    setPage(next)
    // 先回顶部：新一页内容可能更短，否则会停在页面外露出空白
    window.scrollTo(0, 0)
  }

  const remove = async (id: number) => {
    if (!window.confirm('确定要删除这条日志吗？')) return
    try {
      await blogAPI.remove(id)
      // 删完当前页最后一条就回退一页
      if (blogs.length === 1 && page > 1) goToPage(page - 1)
      else load()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : '删除失败，请稍后重试')
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold tracking-tight">日志</h1>

      <form onSubmit={search} className="flex gap-2">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500"
          />
          <input
            type="search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索日志内容..."
            className="w-full min-w-0 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-500/20"
          />
        </div>
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-neutral-900 px-4 text-sm font-medium text-white"
        >
          搜索
        </button>
      </form>

      {loading && blogs.length === 0 ? (
        <p className="py-12 text-center text-sm text-neutral-500 dark:text-neutral-400">加载中...</p>
      ) : error ? (
        <p className="py-12 text-center text-sm text-red-500 dark:text-red-400">{error}</p>
      ) : blogs.length === 0 ? (
        <p className="rounded-2xl bg-white dark:bg-neutral-900 py-12 text-center text-sm text-neutral-500 dark:text-neutral-400 ring-1 ring-neutral-200 dark:ring-neutral-800">
          {appliedKeyword ? '没有找到匹配的日志' : '还没有日志，点底部「添加」写一条吧'}
        </p>
      ) : (
        <div
          className={`space-y-3 transition-opacity duration-200 ${
            loading ? 'pointer-events-none opacity-40' : 'opacity-100'
          }`}
        >
          {blogs.map((blog) => (
            <article key={blog.id} className="overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800">
              <div className="flex items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 px-4 py-2.5">
                <p className="min-w-0 text-xs text-neutral-500 dark:text-neutral-400">
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">
                    {blog.user?.family_member ?? '家人'}
                  </span>
                  :在{' '}
                  <span title={formatFullDate(blog.created_at)}>
                    {formatTimeAgo(blog.created_at)}前
                  </span>{' '}
                  添加了一条
                  {blog.babies && blog.babies.length > 0
                    ? `关于${blog.babies.map((b) => b.name).join('、')}`
                    : ''}
                  数据
                </p>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => navigate(`/blogs/${blog.id}/edit`)}
                    className="rounded-lg p-1.5 text-neutral-400 dark:text-neutral-500 transition-colors hover:bg-green-50 dark:hover:bg-green-950 hover:text-green-600 dark:hover:text-green-400"
                    aria-label="编辑"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(blog.id)}
                    className="rounded-lg p-1.5 text-neutral-400 dark:text-neutral-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400"
                    aria-label="删除"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                  {stripHtml(blog.content)}
                </p>
                <MediaGallery photos={blog.photos} video={blog.video} />
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => goToPage(page - 1)}
            className="rounded-xl bg-white dark:bg-neutral-900 px-4 py-2 text-sm ring-1 ring-neutral-200 dark:ring-neutral-800 disabled:opacity-40"
          >
            上一页
          </button>
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => goToPage(page + 1)}
            className="rounded-xl bg-white dark:bg-neutral-900 px-4 py-2 text-sm ring-1 ring-neutral-200 dark:ring-neutral-800 disabled:opacity-40"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  )
}
