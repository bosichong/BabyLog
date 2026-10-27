export interface User {
  id: number
  username: string
  family_member: string
  gender: string
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface Baby {
  id: number
  name: string
  birthday: string
  records_count?: number
}

export interface Photo {
  id: number
  file_name: string
  storage_path: string
  file_url: string
}

export interface Video {
  id: number
  file_name: string
  storage_path: string
  file_url: string
  duration: number | null
  size_bytes: number | null
}

export interface Blog {
  id: number
  content: string
  created_at: string
  updated_at?: string
  user?: User
  babies?: Baby[]
  photos?: Photo[]
  video?: Video | null
}

export interface HealthRecord {
  id: number
  baby_id: number
  height: number | null
  weight: number | null
  created_at: string
  Baby?: Baby
}

export interface PagedBlogs {
  items: Blog[]
  total: number
  page: number
  pageSize: number
}

/** 上传视频后后端返回的结构（尚未写入数据库） */
export interface UploadedVideo {
  message?: string
  file_name: string
  storage_path: string
  file_url: string
  duration: number | null
  size_bytes: number | null
  width?: number
  height?: number
}
