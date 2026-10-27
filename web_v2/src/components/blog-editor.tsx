import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { ImagePlus, Video as VideoIcon, X } from 'lucide-react'
import { babyAPI, blogAPI, photoAPI, videoAPI } from '@/lib/api'
import { fileUrl, MAX_VIDEO_MB } from '@/lib/config'
import type { Baby, Photo, UploadedVideo, Video } from '@/types'

interface Props {
  mode: 'create' | 'edit'
  blogId?: number
}

type AnyVideo = Video | UploadedVideo

const isNewVideo = (v: AnyVideo | null): v is UploadedVideo =>
  Boolean(v) && !('id' in (v as Video))

export default function BlogEditor({ mode, blogId }: Props) {
  const navigate = useNavigate()

  const [content, setContent] = useState('')
  const [babies, setBabies] = useState<Baby[]>([])
  const [selectedBabies, setSelectedBabies] = useState<number[]>([])
  const [photos, setPhotos] = useState<Photo[]>([])
  const [removedPhotoIds, setRemovedPhotoIds] = useState<number[]>([])
  const [video, setVideo] = useState<AnyVideo | null>(null)
  const [removeVideoFlag, setRemoveVideoFlag] = useState(false)

  const [loading, setLoading] = useState(mode === 'edit')
  const [uploading, setUploading] = useState(false)
  const [videoUploading, setVideoUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [videoError, setVideoError] = useState('')
  const [success, setSuccess] = useState('')

  const submittedRef = useRef(false)
  const pendingRef = useRef<{ photos: Photo[]; video: UploadedVideo | null }>({
    photos: [],
    video: null,
  })

  // 记录尚未提交的新上传文件，供离开页面时清理
  useEffect(() => {
    pendingRef.current = {
      photos: photos.filter((p) => !p.id),
      video: video && isNewVideo(video) ? video : null,
    }
  }, [photos, video])

  // 关闭浏览器 / 刷新时清理
  useEffect(() => {
    const handler = () => {
      if (submittedRef.current) return
      pendingRef.current.photos.forEach((p) => {
        navigator.sendBeacon?.(
          `/v1/photos/delete_img`,
          new Blob([JSON.stringify({ photo_path: p.storage_path })], {
            type: 'application/json',
          }),
        )
      })
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  // 路由离开时清理未提交的新文件
  useEffect(() => {
    return () => {
      if (submittedRef.current) return
      const { photos: pendingPhotos, video: pendingVideo } = pendingRef.current
      pendingPhotos.forEach((p) => {
        photoAPI.removeByPath(p.storage_path).catch(() => {})
      })
      if (pendingVideo) videoAPI.remove(pendingVideo.storage_path).catch(() => {})
    }
  }, [])

  // 加载宝宝列表 + 编辑模式下的日志数据
  useEffect(() => {
    const load = async () => {
      try {
        const list = await babyAPI.list()
        setBabies(list)

        if (mode === 'edit' && blogId) {
          const blog = await blogAPI.get(blogId)
          setContent(blog.content ?? '')
          setSelectedBabies((blog.babies ?? []).map((b) => b.id))
          setPhotos(blog.photos ?? [])
          setVideo(blog.video ?? null)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [mode, blogId])

  const toggleBaby = (id: number) => {
    setSelectedBabies((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  // ---------- 图片 ----------
  const addPhotos = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    setError('')
    try {
      const uploaded: Photo[] = []
      for (const file of Array.from(files)) {
        const data = await photoAPI.upload(file)
        uploaded.push(data)
      }
      setPhotos((prev) => [...prev, ...uploaded])
    } catch (err) {
      setError(err instanceof Error ? err.message : '图片上传失败')
    } finally {
      setUploading(false)
    }
  }

  const removePhoto = async (photo: Photo) => {
    setPhotos((prev) => prev.filter((p) => p !== photo))
    if (photo.id) {
      // 已有图片：提交时由后端删除
      setRemovedPhotoIds((prev) => [...prev, photo.id])
    } else {
      // 刚上传的：立刻删文件
      photoAPI.removeByPath(photo.storage_path).catch(() => {})
    }
  }

  // ---------- 视频 ----------
  const addVideo = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return

    const sizeMB = file.size / 1024 / 1024
    if (sizeMB > MAX_VIDEO_MB) {
      setVideoError(`视频 ${sizeMB.toFixed(1)}MB，超过 ${MAX_VIDEO_MB}MB 上限，请压缩或裁剪后再试`)
      return
    }

    setVideoUploading(true)
    setVideoError('')
    try {
      // 替换式：先清掉原来的
      if (video) {
        if (isNewVideo(video)) {
          await videoAPI.remove(video.storage_path).catch(() => {})
        } else {
          setRemoveVideoFlag(true)
        }
      }
      const data = await videoAPI.upload(file)
      setVideo(data)
      setRemoveVideoFlag(false)
    } catch (err) {
      setVideoError(err instanceof Error ? err.message : '视频上传失败')
    } finally {
      setVideoUploading(false)
    }
  }

  const removeVideo = async () => {
    if (!video) return
    if (isNewVideo(video)) {
      await videoAPI.remove(video.storage_path).catch(() => {})
    } else {
      setRemoveVideoFlag(true)
    }
    setVideo(null)
    setVideoError('')
  }

  // ---------- 提交 ----------
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return

    if (!content.trim()) {
      setError('请输入日志内容')
      return
    }
    if (selectedBabies.length === 0) {
      setError('请选择至少一个宝宝')
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess('')

    const photoPayload = photos.map((p) => ({
      id: p.id,
      file_name: p.file_name,
      storage_path: p.storage_path,
      file_url: p.file_url,
    }))

    const videoPayload =
      video && isNewVideo(video)
        ? {
            file_name: video.file_name,
            storage_path: video.storage_path,
            file_url: video.file_url,
            duration: video.duration,
            size_bytes: video.size_bytes,
          }
        : undefined

    try {
      if (mode === 'create') {
        await blogAPI.create({
          content,
          baby_ids: selectedBabies,
          photo_ids: photoPayload,
          video: videoPayload,
        })
      } else if (blogId) {
        await blogAPI.update(blogId, {
          content,
          baby_ids: selectedBabies,
          photo_ids: photoPayload.filter((p) => p.id),
          removed_photo_ids: removedPhotoIds,
          video: videoPayload,
          remove_video: removeVideoFlag || undefined,
        })
      }

      submittedRef.current = true
      setSuccess(mode === 'create' ? '创建成功！' : '保存成功！')
      navigate('/blogs', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <p className="py-16 text-center text-sm text-neutral-500 dark:text-neutral-400">加载中...</p>
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <h1 className="text-xl font-bold tracking-tight">
        {mode === 'create' ? '写日志' : '编辑日志'}
      </h1>

      {/* 内容 */}
      <div className="space-y-1.5">
        <label htmlFor="content" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          内容
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          placeholder="今天发生了什么..."
          className="w-full resize-y rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-3 text-sm leading-relaxed outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-500/20"
        />
      </div>

      {/* 宝宝选择 */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">关联宝宝</p>
        <div className="flex flex-wrap gap-2">
          {babies.map((baby) => {
            const checked = selectedBabies.includes(baby.id)
            return (
              <button
                key={baby.id}
                type="button"
                onClick={() => toggleBaby(baby.id)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  checked
                    ? 'bg-green-600 text-white'
                    : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 ring-1 ring-neutral-300 dark:ring-neutral-700'
                }`}
              >
                {baby.name}
              </button>
            )
          })}
          {babies.length === 0 && (
            <p className="text-sm text-neutral-400 dark:text-neutral-500">还没有宝宝，先去「管理」添加</p>
          )}
        </div>
      </div>

      {/* 图片 */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">图片</p>
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 py-3 text-sm text-neutral-500 dark:text-neutral-400 transition-colors hover:border-green-400 hover:text-green-600 dark:hover:text-green-400">
          <ImagePlus size={16} />
          {uploading ? '上传中...' : '选择图片（可多选）'}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              addPhotos(e.target.files)
              e.target.value = ''
            }}
          />
        </label>

        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo, i) => (
              <div key={photo.id ?? `new-${i}`} className="relative">
                <img
                  src={fileUrl(photo.storage_path)}
                  alt={photo.file_name}
                  className="h-24 w-full rounded-xl object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(photo)}
                  className="absolute -right-1.5 -top-1.5 rounded-full bg-neutral-900 p-1 text-white shadow"
                  aria-label="移除图片"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 视频 */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          视频<span className="ml-1 text-xs font-normal text-neutral-400 dark:text-neutral-500">（可选，单个，最大 500MB）</span>
        </p>

        {!video && (
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 py-3 text-sm text-neutral-500 dark:text-neutral-400 transition-colors hover:border-green-400 hover:text-green-600 dark:hover:text-green-400">
            <VideoIcon size={16} />
            {videoUploading ? '上传并转码中...' : '选择视频'}
            <input
              type="file"
              accept="video/*"
              className="hidden"
              disabled={videoUploading}
              onChange={(e) => {
                addVideo(e.target.files)
                e.target.value = ''
              }}
            />
          </label>
        )}

        {videoUploading && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">视频上传并转码中，大文件可能需要 1 分钟...</p>
        )}
        {videoError && <p className="text-xs text-red-500 dark:text-red-400">{videoError}</p>}

        {video && (
          <div className="space-y-2">
            <video
              controls
              playsInline
              preload="metadata"
              src={fileUrl(video.storage_path)}
              className="max-h-[320px] w-full rounded-xl bg-black"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={removeVideo}
                className="rounded-lg bg-red-50 dark:bg-red-950 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400"
              >
                移除视频
              </button>
              <label className="cursor-pointer rounded-lg bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                换一个
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  disabled={videoUploading}
                  onChange={(e) => {
                    addVideo(e.target.files)
                    e.target.value = ''
                  }}
                />
              </label>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
      {success && <p className="text-sm text-green-600 dark:text-green-400">{success}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting || uploading || videoUploading}
          className="flex-1 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
        >
          {submitting ? '提交中...' : mode === 'create' ? '发布' : '保存'}
        </button>
        <button
          type="button"
          onClick={() => navigate('/blogs')}
          className="rounded-xl bg-white dark:bg-neutral-900 px-5 py-3 text-sm font-medium text-neutral-600 dark:text-neutral-400 ring-1 ring-neutral-300 dark:ring-neutral-700"
        >
          取消
        </button>
      </div>
    </form>
  )
}
