import { API_BASE } from './config'
import { auth } from './auth'
import { notifyError } from './error-notification'
import type {
  Baby,
  Blog,
  HealthRecord,
  PagedBlogs,
  Photo,
  UploadedVideo,
  User,
} from '../types'

export class ApiError extends Error {
  status: number
  reason?: string
  constructor(message: string, status: number, reason?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.reason = reason
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  formData?: FormData
  params?: Record<string, unknown>
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, formData, params } = options
  const token = auth.getToken()

  let url = `${API_BASE}${path}`
  if (params) {
    const search = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined) return
      if (Array.isArray(value)) {
        value.forEach((v) => search.append(key, String(v)))
      } else {
        search.append(key, String(value))
      }
    })
    const qs = search.toString()
    if (qs) url += `?${qs}`
  }

  const headers: Record<string, string> = {}
  if (!formData) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(url, {
      method,
      headers,
      body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
    })
  } catch (error) {
    const networkReason = error instanceof Error ? error.message : '未知网络错误'
    const message = `网络请求失败，无法连接服务器：${networkReason}`
    notifyError(message)
    throw new ApiError(message, 0, networkReason)
  }

  // 登录态失效统一处理。
  // 注意：/auth/ 下的 401 是「用户名或密码错误」，不能当成登录过期，
  // 否则真实原因会被掩盖成误导性的提示。
  if (res.status === 401 && !path.startsWith('/auth/')) {
    const message = '登录已过期，请重新登录'
    auth.clear()
    notifyError(message, 401)
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login'
    }
    throw new ApiError(message, 401)
  }

  const text = await res.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!res.ok) {
    const body = data as { message?: string; reason?: string; error?: string } | null
    const baseMessage = body?.message || body?.error || `请求失败 (${res.status})`
    const reason = typeof body?.reason === 'string' ? body.reason.trim() : ''
    const message =
      reason && reason !== baseMessage ? `${baseMessage}：${reason}` : baseMessage
    notifyError(message, res.status)
    throw new ApiError(message, res.status, reason || undefined)
  }

  if (
    data &&
    typeof data === 'object' &&
    !Array.isArray(data) &&
    (data as { status?: string }).status === 'success' &&
    'data' in data
  ) {
    return (data as { data: T }).data
  }

  return data as T
}

export const http = {
  get: <T>(path: string, params?: Record<string, unknown>) =>
    request<T>(path, { method: 'GET', params }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  upload: <T>(path: string, formData: FormData) =>
    request<T>(path, { method: 'POST', formData }),
}

export const authAPI = {
  login: (username: string, password: string) =>
    http.post<{ access_token: string }>('/auth/token', { username, password }),
  register: (payload: {
    username: string
    password: string
    family_member: string
    gender: string
    baby_name?: string
    baby_birthday?: string
  }) => http.post<User>('/auth/register', payload),
}

export const userAPI = {
  list: () => http.get<User[]>('/users'),
  create: (payload: Partial<User> & { password?: string }) =>
    http.post<User>('/users', payload),
  update: (id: number, payload: Partial<User> & { password?: string }) =>
    http.post<User>(`/users/${id}/update`, payload),
  remove: (id: number) => http.post<null>(`/users/${id}/delete`),
}

export const babyAPI = {
  list: () => http.get<Baby[]>('/babies'),
  create: (payload: Partial<Baby>) => http.post<Baby>('/babies', payload),
  update: (id: number, payload: Partial<Baby>) =>
    http.post<Baby>(`/babies/${id}/update`, payload),
  remove: (id: number) => http.post<null>(`/babies/${id}/delete`),
  blogCount: (id: number) => http.get<{ count: number }>(`/babies/${id}/blogs/count`),
}

export const blogAPI = {
  search: (params: { page?: number; pageSize?: number; keyword?: string } = {}) =>
    http.post<PagedBlogs & { totalPages?: number }>('/blogs/search', params),
  get: (id: number) => http.get<Blog>(`/blogs/${id}`),
  create: (payload: {
    content: string
    baby_ids: number[]
    photo_ids?: unknown[]
    video?: unknown
  }) => http.post<Blog>('/blogs', payload),
  update: (
    id: number,
    payload: {
      content: string
      baby_ids: number[]
      photo_ids?: unknown[]
      removed_photo_ids?: number[]
      video?: unknown
      remove_video?: boolean
    },
  ) => http.post<Blog>(`/blogs/${id}/update`, payload),
  remove: (id: number) => http.del<null>(`/blogs/${id}`),
  memoriesToday: () => http.get<Blog[]>('/blogs/memories/today'),
}

export const photoAPI = {
  upload: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return http.upload<Photo>('/photos/uploadfile', formData)
  },
  removeByPath: (storagePath: string) =>
    http.post<null>('/photos/delete_img', { photo_path: storagePath }),
}

export const videoAPI = {
  upload: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return http.upload<UploadedVideo>('/videos/uploadfile', formData)
  },
  remove: (storagePath: string) =>
    http.post<null>('/videos/delete', { video_path: storagePath }),
}

export const healthAPI = {
  list: (babyIds?: number[]) =>
    http.get<HealthRecord[]>('/healthies', babyIds?.length ? { baby_ids: babyIds } : undefined),
  create: (payload: { baby_id: number; height?: number; weight?: number }) =>
    http.post<HealthRecord>('/healthies', payload),
  update: (id: number, payload: { height?: number; weight?: number }) =>
    http.post<HealthRecord>(`/healthies/${id}/update`, payload),
  remove: (id: number) => http.post<null>(`/healthies/${id}/delete`),
}
