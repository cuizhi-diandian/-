const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const getApiOrigin = (): string => {
  try {
    const parsed = new URL(API_BASE_URL);
    return parsed.origin;
  } catch {
    return '';
  }
};

export const resolveMediaUrl = (url?: string | null): string => {
  if (!url) {
    return '';
  }

  if (/^(https?:)?\/\//.test(url) || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  if (url.startsWith('/')) {
    const origin = getApiOrigin();
    return origin ? `${origin}${url}` : url;
  }

  return url;
};
