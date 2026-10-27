import { useParams } from 'react-router'
import BlogEditor from '@/components/blog-editor'

export default function BlogEditPage() {
  const { id } = useParams()
  const blogId = Number(id)

  if (!blogId) {
    return <p className="py-16 text-center text-sm text-neutral-500 dark:text-neutral-400">无效的日志 ID</p>
  }

  return <BlogEditor mode="edit" blogId={blogId} />
}
