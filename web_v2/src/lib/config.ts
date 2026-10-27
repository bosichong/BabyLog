// 开发环境由 Vite 代理转发到后端（见 vite.config.ts），生产环境由服务器托管
export const API_BASE = '/v1'
export const UPLOAD_BASE = '/uploads'

/** 把数据库里的 storage_path 转成可访问的 URL */
export function fileUrl(storagePath: string | null | undefined): string {
  if (!storagePath) return ''
  return `${UPLOAD_BASE}/${storagePath}`
}

/** 视频大小上限（与后端 MAX_SIZE_MB 一致） */
export const MAX_VIDEO_MB = 500
