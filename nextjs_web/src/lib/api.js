// 导入API配置
import { FULL_API_BASE_URL, API_BASE_URL, UPLOAD_CONFIG } from './config';

// 创建API请求函数
const createApiRequest = (endpoint, method) => async (data = null) => {
  const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];

  console.log(`[API请求] ${method} ${FULL_API_BASE_URL}${endpoint}`);
  console.log('请求参数:', data);
  console.log('Token:', token ? '已设置' : '未设置');

  let url = `${FULL_API_BASE_URL}${endpoint}`;
  if (method === 'GET' && data) {
    const params = new URLSearchParams();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        // 对于数字类型的参数，确保使用Number转换
        const processedValue = typeof value === 'number' ? Number(value).toString() : value.toString();
        params.append(key, processedValue);
      }
    });
    url += `?${params.toString()}`;
  }

  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    body: method !== 'GET' ? (data ? JSON.stringify(data) : null) : null
  };

  console.log('请求配置:', {
    ...config,
    headers: { ...config.headers },
    body: config.body ? JSON.parse(config.body) : null
  });

  try {
    console.log('%c[API请求]%c 开始发送请求', 'color: #4CAF50; font-weight: bold', 'color: black');
    console.log('%c[URL]%c ' + `${FULL_API_BASE_URL}${endpoint}`, 'color: #2196F3; font-weight: bold', 'color: black');
    console.log('%c[时间]%c ' + new Date().toISOString(), 'color: #9C27B0; font-weight: bold', 'color: black');
    
    // 添加超时检查
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('请求超时')), 10000);
    });

    const fetchPromise = fetch(`${FULL_API_BASE_URL}${endpoint}`, config);
    const response = await Promise.race([fetchPromise, timeoutPromise]);
    
    console.log(`[${new Date().toISOString()}] 收到响应状态:`, response.status, response.statusText);
    
    // 处理 204 No Content 响应
    if (response.status === 204) {
      console.log('请求成功，无响应内容');
      return null;
    }

    const responseData = await response.json();
    console.log('响应数据:', responseData);

    if (!response.ok) {
      console.error('请求失败:', responseData);
      throw responseData;
    }

    return responseData;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] 捕获到错误:`, error);
    
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      // 尝试检查服务器连接
      console.log('正在检查服务器连接...');
      const networkError = { 
        message: '网络连接失败，请确保：\n1. 服务器已启动\n2. 服务器地址配置正确 (当前地址: ' + FULL_API_BASE_URL + ')\n3. 网络连接正常'
      };
      console.error('网络错误详情:', networkError);
      throw networkError;
    }
    
    if (error.message === '请求超时') {
      const timeoutError = { 
        message: '请求超时，请检查服务器响应时间或网络连接'
      };
      console.error('超时错误:', timeoutError);
      throw timeoutError;
    }
    
    throw error;
  }
};

// Auth API
export const authAPI = {
  login: async (data) => {
    const response = await createApiRequest('/auth/token', 'POST')(data);
    if (response && response.access_token) {
      // 设置token
      localStorage.setItem('access_token', response.access_token);
      document.cookie = `token=${response.access_token}; path=/`;
      return response;
    }
    throw new Error('登录失败：响应中缺少必要信息');
  },
  register: createApiRequest('/auth/register', 'POST'),
  logout: async () => {
    await createApiRequest('/auth/logout', 'POST')();
    localStorage.removeItem('user_info');
    localStorage.removeItem('access_token');
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    document.cookie = 'user_info=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
  }
};

// User API
export const userAPI = {
  getUsers: createApiRequest('/users', 'GET'),
  getUserById: (id) => createApiRequest(`/users/${id}`, 'GET')(),
  createUser: createApiRequest('/users', 'POST'),
  updateUser: (params) => createApiRequest(`/users/${params.id}/update`, 'POST')(params),
  deleteUser: (params) => createApiRequest(`/users/${params.id}/delete`, 'POST')(),
};

// Baby API
export const babyAPI = {
  getBabies: createApiRequest('/babies', 'GET'),
  getBabyById: (id) => createApiRequest(`/babies/${id}`, 'GET')(),
  createBaby: createApiRequest('/babies', 'POST'),
  updateBaby: (params) => createApiRequest(`/babies/${params.id}/update`, 'POST')(params),
  deleteBaby: (params) => createApiRequest(`/babies/${params.id}/delete`, 'POST')(),
  getBlogCountByBabyId: async ({ babyId }) => {
    const response = await createApiRequest(`/babies/${babyId}/blogs/count`, 'GET')();
    return response.count;
  }
};

// Blog API
export const blogAPI = {
  getBlogs: createApiRequest('/blogs/search', 'POST'),
  getBlogById: (id) => createApiRequest(`/blogs/${id}`, 'GET')(),
  createBlog: createApiRequest('/blogs', 'POST'),
  updateBlog: (params) => createApiRequest(`/blogs/${params.id}/update`, 'POST')(params),
  deleteBlog: (params) => createApiRequest(`/blogs/${params.id}`, 'DELETE')(),
  getMemoriesToday: createApiRequest('/blogs/memories/today', 'GET')
};

// Health API
export const healthAPI = {
  getHealthRecords: createApiRequest('/healthies', 'GET'),
  createHealthRecord: createApiRequest('/healthies', 'POST'),
  updateHealthRecord: (params) => createApiRequest(`/healthies/${params.id}/update`, 'POST')(params),
  deleteHealthRecord: (params) => createApiRequest(`/healthies/${params.id}/delete`, 'POST')()
};