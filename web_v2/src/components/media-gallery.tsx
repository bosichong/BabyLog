import { useState } from 'react'
import { X } from 'lucide-react'
import { fileUrl } from '@/lib/config'
import type { Photo, Video } from '@/types'

interface Props {
  photos?: Photo[]
  video?: Video | null
}

/** 日志媒体区：视频播放器 + 图片网格（点开看大图） */
export default function MediaGallery({ photos, video }: Props) {
  const [preview, setPreview] = useState<string | null>(null)

  const hasPhotos = Boolean(photos && photos.length > 0)
  const hasVideo = Boolean(video && video.storage_path)

  if (!hasPhotos && !hasVideo) return null

  return (
    <div className="mt-3 space-y-3">
      {hasVideo && (
        <video
          controls
          playsInline
          preload="metadata"
          className="w-full max-h-[420px] rounded-xl bg-black"
          src={fileUrl(video!.storage_path)}
        />
      )}

      {hasPhotos && (
        <div className="grid grid-cols-2 gap-2">
          {photos!.map((photo) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setPreview(fileUrl(photo.storage_path))}
              className="overflow-hidden rounded-xl"
            >
              <img
                src={fileUrl(photo.storage_path)}
                alt={photo.file_name}
                loading="lazy"
                className="h-28 w-full object-cover transition-transform active:scale-95"
              />
            </button>
          ))}
        </div>
      )}

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setPreview(null)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/15 p-2 text-white"
            onClick={() => setPreview(null)}
            aria-label="关闭"
          >
            <X size={20} />
          </button>
          <img
            src={preview}
            alt="预览"
            className="max-h-full max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
