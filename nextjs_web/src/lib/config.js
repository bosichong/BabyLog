// 系统配置文件

// API基础URL配置
export const API_BASE_URL = 'http://localhost:8888';

// API版本前缀
export const API_VERSION = '/v1';

// 完整的API基础URL
export const FULL_API_BASE_URL = `${API_BASE_URL}${API_VERSION}`;

// 文件上传相关配置
export const UPLOAD_CONFIG = {
  // 上传文件的基础URL
  BASE_URL: API_BASE_URL,
  // 上传文件的存储路径
  STORAGE_PATH: '/uploads',
  // 获取完整的文件URL
  getFileUrl: (filePath) => {
    // 确保路径中的反斜杠被替换为正斜杠
    const normalizedPath = filePath.replace(/\\/g, '/');
    // 确保路径不以斜杠开头，避免双斜杠
    const cleanPath = normalizedPath.startsWith('/') ? normalizedPath.substring(1) : normalizedPath;
    return `${API_BASE_URL}${UPLOAD_CONFIG.STORAGE_PATH}/${cleanPath}`;
  }
};