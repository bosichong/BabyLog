import { useState } from 'react'
import { Play, X } from 'lucide-react'
import { fileUrl } from '@/lib/config'
import type { Photo, Video } from '@/types'

interface Props {
  photos?: Photo[]
  video?: Video | null
}

type Preview = { type: 'image' | 'video'; src: string }

function formatDuration(seconds: number | null | undefined) {
  if (!seconds || !Number.isFinite(seconds)) return ''
  const total = Math.max(0, Math.round(seconds))
  const minutes = Math.floor(total / 60)
  const rest = String(total % 60).padStart(2, '0')
  return `${minutes}:${rest}`
}

/** 日志媒体区：微信朋友圈式缩略图网格，点击后查看大图/播放视频 */
export default function MediaGallery({ photos, video }: Props) {
  const [preview, setPreview] = useState<Preview | null>(null)

  const photoList = photos ?? []
  const photoCount = photoList.length
  const hasVideo = Boolean(video?.storage_path)
  const videoSrc = hasVideo ? fileUrl(video!.storage_path) : ''
  const duration = formatDuration(video?.duration)

  if (photoCount === 0 && !hasVideo) return null

  const photoGridClass =
    photoCount === 2 || photoCount === 4
      ? 'grid max-w-[360px] grid-cols-2 gap-1.5'
      : 'grid max-w-[360px] grid-cols-3 gap-1.5'

  return (
    <div className="mt-3 space-y-2.5">
      {hasVideo && (
        <button
          type="button"
          onClick={() => setPreview({ type: 'video', src: videoSrc })}
          className="group relative block aspect-video w-full max-w-[360px] overflow-hidden rounded-xl bg-neutral-900"
          aria-label="播放视频"
        >
          <video
            src={`${videoSrc}#t=0.1`}
            preload="metadata"
            muted
            playsInline
            className="pointer-events-none h-full w-full object-cover"
          />
          <span className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/20" />
          <span className="absolute left-1/2 top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white shadow-lg backdrop-blur-sm">
            <Play size={19} fill="currentColor" className="ml-0.5" />
          </span>
          {duration && (
            <span className="absolute bottom-2 right-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] font-medium text-white">
              {duration}
            </span>
          )}
        </button>
      )}

      {photoCount > 0 && (
        <div className={photoCount === 1 ? 'flex' : photoGridClass}>
          {photoList.map((photo) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setPreview({ type: 'image', src: fileUrl(photo.storage_path) })}
              className={
                photoCount === 1
                  ? 'relative aspect-[4/3] w-[72%] max-w-[260px] overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800'
                  : 'relative aspect-square w-full overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800'
              }
              aria-label={`查看图片 ${photo.file_name}`}
            >
              <img
                src={fileUrl(photo.storage_path)}
                alt={photo.file_name}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-200 active:scale-[0.98]"
              />
            </button>
          ))}
        </div>
      )}

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setPreview(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/15 p-2 text-white"
            onClick={() => setPreview(null)}
            aria-label="关闭"
          >
            <X size={20} />
          </button>
          {preview.type === 'image' ? (
            <img
              src={preview.src}
              alt="预览"
              className="max-h-full max-w-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <video
              src={preview.src}
              controls
              autoPlay
              playsInline
              className="max-h-full max-w-full rounded-lg bg-black"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </div>
  )
}
