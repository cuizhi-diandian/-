import axios, { AxiosError } from 'axios';

const STEP_API_BASE_URL = 'https://api.stepfun.com/v1';

const getApiKey = (): string => {
  const apiKey = process.env.STEP_API_KEY;
  if (!apiKey) {
    throw new Error('STEP_API_KEY is not configured');
  }
  return apiKey;
};

const parseProviderError = (data: unknown): string | undefined => {
  if (!data) {
    return undefined;
  }

  if (Buffer.isBuffer(data)) {
    try {
      const text = data.toString('utf-8');
      const parsed = JSON.parse(text);
      if (parsed?.error?.message) {
        return parsed.error.message;
      }
      if (typeof parsed?.message === 'string') {
        return parsed.message;
      }
    } catch {
      return undefined;
    }
  }

  if (typeof data === 'object' && data !== null) {
    const maybe = data as any;
    if (typeof maybe?.error?.message === 'string') {
      return maybe.error.message;
    }
    if (typeof maybe?.message === 'string') {
      return maybe.message;
    }
  }

  return undefined;
};

export interface CloneVoiceRequest {
  fileId: string;
  model: string;
  text?: string;
  sampleText?: string;
}

export interface CloneVoiceResponse {
  id: string;
  object: string;
  duplicated?: boolean;
  sampleText?: string;
  sampleAudio?: string; // base64
}

export interface GenerateSpeechRequest {
  input: string;
  voice: string;
  model: string;
}

export interface UploadFileResponse {
  id: string;
  object: string;
  bytes: number;
  created_at: number;
  filename: string;
  purpose: string;
}

export interface ProviderHealthStatus {
  provider: 'stepfun';
  configured: boolean;
  reachable?: boolean;
  error?: string;
}

export interface ProviderHealthReport {
  timestamp: string;
  probe: boolean;
  providers: ProviderHealthStatus[];
}

export class StepFunService {
  private async makeRequest<T>(method: string, endpoint: string, data?: any): Promise<T> {
    const STEP_API_KEY = getApiKey();

    try {
      const response = await axios({
        method,
        url: `${STEP_API_BASE_URL}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${STEP_API_KEY}`,
        },
        data,
        timeout: 30000,
      });

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('StepFun API Error:', {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        endpoint,
        requestData: data,
      });

      if (axiosError.response?.status === 401) {
        throw new Error('API密钥无效，请检查 STEP_API_KEY 配置');
      }

      if (axiosError.response?.status === 429) {
        throw new Error('API请求频率过高，请稍后重试');
      }

      if (axiosError.code === 'ECONNABORTED') {
        throw new Error('请求超时，请稍后重试');
      }

      throw new Error(axiosError.message || 'StepFun API请求失败');
    }
  }

  async uploadAudioFile(filePath: string): Promise<UploadFileResponse> {
    const STEP_API_KEY = getApiKey();
    const FormData = require('form-data');
    const fs = require('fs');

    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('purpose', 'storage');

    try {
      const response = await axios({
        method: 'POST',
        url: `${STEP_API_BASE_URL}/files`,
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${STEP_API_KEY}`,
        },
        data: formData,
        timeout: 60000,
      });

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      throw new Error(`文件上传到 StepFun 失败: ${JSON.stringify(axiosError.response?.data)}`);
    }
  }

  async cloneVoice(request: CloneVoiceRequest): Promise<CloneVoiceResponse> {
    return this.makeRequest<CloneVoiceResponse>('POST', '/audio/voices', {
      file_id: request.fileId,
      model: request.model,
      text: request.text,
      sample_text: request.sampleText,
    });
  }

  async getProviderHealth(probe: boolean = false): Promise<ProviderHealthReport> {
    const stepConfigured = Boolean(process.env.STEP_API_KEY);
    const providers: ProviderHealthStatus[] = [{ provider: 'stepfun', configured: stepConfigured }];

    if (!probe || !stepConfigured) {
      return {
        timestamp: new Date().toISOString(),
        probe,
        providers,
      };
    }

    const stepProvider = providers[0];
    try {
      await axios({
        method: 'GET',
        url: `${STEP_API_BASE_URL}/models`,
        headers: {
          Authorization: `Bearer ${getApiKey()}`,
        },
        timeout: 10000,
      });
      stepProvider.reachable = true;
    } catch (error) {
      const axiosError = error as AxiosError;
      stepProvider.reachable = false;
      stepProvider.error = parseProviderError(axiosError.response?.data) || axiosError.message || 'StepFun provider check failed';
    }

    return {
      timestamp: new Date().toISOString(),
      probe,
      providers,
    };
  }

  async generateSpeech(request: GenerateSpeechRequest): Promise<Buffer> {
    const STEP_API_KEY = getApiKey();

    const response = await axios({
      method: 'POST',
      url: `${STEP_API_BASE_URL}/audio/speech`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${STEP_API_KEY}`,
      },
      data: {
        input: request.input,
        voice: request.voice,
        model: request.model,
      },
      responseType: 'arraybuffer',
      timeout: 30000,
    });

    return Buffer.from(response.data);
  }
}

export default new StepFunService();
