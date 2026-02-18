import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';


const buildNetworkErrorHint = (): string => {
  const target = API_BASE_URL;
  const isHttpTarget = target.startsWith('http://');
  const isRelativeTarget = target.startsWith('/');
  const isHttpsPage = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const isLocalApiOnRemotePage =
    typeof window !== 'undefined' &&
    !['localhost', '127.0.0.1'].includes(window.location.hostname) &&
    /localhost|127\.0\.0\.1/.test(target);
  const isGitHubPagesRelativeApi =
    typeof window !== 'undefined' && window.location.hostname.endsWith('github.io') && isRelativeTarget;

  if (isHttpsPage && isHttpTarget) {
    return `网络连接失败：当前页面是 HTTPS，但 API 使用 HTTP（${target}），请改为 HTTPS 后端地址。`;
  }

  if (isLocalApiOnRemotePage) {
    return `网络连接失败：当前 API 地址为 ${target}，部署到 GitHub Pages 后无法访问本地 localhost 服务。请设置 VITE_API_BASE_URL 为可公网访问的后端地址。`;
  }

  if (isGitHubPagesRelativeApi) {
    return '网络连接失败：当前站点运行在 GitHub Pages，默认 /api 无后端服务。请在 Pages 构建时配置 VITE_API_BASE_URL 指向可公网访问的 HTTPS 后端。';
  }

  return `网络连接失败，请检查后端服务与 API 地址：${target}`;
};


const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 可以在这里添加token等
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 统一错误处理
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    // 网络错误重试（指数退避）
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      // 可以在这里实现重试逻辑
    }

    // StepFun API错误映射
    if (error.response?.data?.error?.code === 'invalid_api_key') {
      return Promise.reject(new Error('API密钥无效，请检查配置'));
    }

    if (error.code === 'ERR_NETWORK') {
      return Promise.reject(new Error(buildNetworkErrorHint()));
    }

    // 统一错误格式
    const errorMessage = error.response?.data?.message || error.message || '请求失败';
    return Promise.reject(new Error(errorMessage));
  }
);

export default apiClient;



