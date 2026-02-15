import axios, { AxiosError } from 'axios';

const STEP_API_BASE_URL = 'https://api.stepfun.com/v1';
const QWEN_API_BASE_URL = process.env.QWEN_API_BASE_URL || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';

// 动态获取 API Key 的函数
const getApiKey = (): string => {
  const apiKey = process.env.STEP_API_KEY;
  if (!apiKey) {
    throw new Error('STEP_API_KEY is not configured');
  }
  return apiKey;
};

const getQwenApiKey = (): string => {
  const apiKey = process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY;
  if (!apiKey) {
    throw new Error('DASHSCOPE_API_KEY (or QWEN_API_KEY) is not configured');
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
  provider: 'stepfun' | 'qwen';
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
    const STEP_API_KEY = getApiKey(); // 动态获取 API Key

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
      
      // 记录详细的错误信息
      console.error('StepFun API Error:', {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        endpoint,
        requestData: data,
      });
      
      if (axiosError.response?.status === 401) {
        const errorMessage = axiosError.response?.data || 'Invalid API key';
        console.error('StepFun API authentication error:', errorMessage);
        throw new Error('API密钥无效，请检查配置');
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

  /**
   * 上传音频文件到 StepFun（用于语音克隆）
   */
  async uploadAudioFile(filePath: string): Promise<UploadFileResponse> {
    const STEP_API_KEY = getApiKey();
    const FormData = require('form-data');
    const fs = require('fs');
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('purpose', 'storage'); // 使用 storage 作为 purpose

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

      console.log('File uploaded to StepFun successfully:', response.data);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('StepFun File Upload Error:', {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
      });
      throw new Error(`文件上传到 StepFun 失败: ${JSON.stringify(axiosError.response?.data)}`);
    }
  }

  /**
   * 复刻音色
   */
  async cloneVoice(request: CloneVoiceRequest): Promise<CloneVoiceResponse> {
    return this.makeRequest<CloneVoiceResponse>('POST', '/audio/voices', {
      file_id: request.fileId,
      model: request.model,
      text: request.text,
      sample_text: request.sampleText,
    });
  }

  async getProviderHealth(probe: boolean = false): Promise<ProviderHealthReport> {
    const providers: ProviderHealthStatus[] = [];

    const stepConfigured = Boolean(process.env.STEP_API_KEY);
    const qwenConfigured = Boolean(process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY);

    providers.push({ provider: 'stepfun', configured: stepConfigured });
    providers.push({ provider: 'qwen', configured: qwenConfigured });

    if (!probe) {
      return {
        timestamp: new Date().toISOString(),
        probe: false,
        providers,
      };
    }

    if (qwenConfigured) {
      const qwenProvider = providers.find((p) => p.provider === 'qwen');
      try {
        await axios({
          method: 'GET',
          url: `${QWEN_API_BASE_URL}/models`,
          headers: {
            Authorization: `Bearer ${getQwenApiKey()}`,
          },
          timeout: 10000,
        });
        if (qwenProvider) {
          qwenProvider.reachable = true;
        }
      } catch (error) {
        const axiosError = error as AxiosError;
        if (qwenProvider) {
          qwenProvider.reachable = false;
          qwenProvider.error =
            parseProviderError(axiosError.response?.data) ||
            axiosError.message ||
            'Qwen provider check failed';
        }
      }
    }

    if (stepConfigured) {
      const stepProvider = providers.find((p) => p.provider === 'stepfun');
      try {
        await axios({
          method: 'GET',
          url: `${STEP_API_BASE_URL}/models`,
          headers: {
            Authorization: `Bearer ${getApiKey()}`,
          },
          timeout: 10000,
        });
        if (stepProvider) {
          stepProvider.reachable = true;
        }
      } catch (error) {
        const axiosError = error as AxiosError;
        if (stepProvider) {
          stepProvider.reachable = false;
          stepProvider.error =
            parseProviderError(axiosError.response?.data) ||
            axiosError.message ||
            'StepFun provider check failed';
        }
      }
    }

    return {
      timestamp: new Date().toISOString(),
      probe: true,
      providers,
    };
  }

  /**
   * 生成TTS音频
   */
  async generateSpeech(request: GenerateSpeechRequest): Promise<Buffer> {
    if (request.model === 'qwen3-tts-instruct-flash') {
      return this.generateSpeechWithQwen(request);
    }

    const STEP_API_KEY = getApiKey(); // 动态获取 API Key
    
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

  private async generateSpeechWithQwen(request: GenerateSpeechRequest): Promise<Buffer> {
    const qwenApiKey = getQwenApiKey();

    try {
      const response = await axios({
        method: 'POST',
        url: `${QWEN_API_BASE_URL}/audio/speech`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${qwenApiKey}`,
        },
        data: {
          model: request.model,
          input: request.input,
          voice: process.env.QWEN_TTS_VOICE || 'Cherry',
          response_format: process.env.QWEN_TTS_FORMAT || 'mp3',
        },
        responseType: 'arraybuffer',
        timeout: 30000,
      });

      return Buffer.from(response.data);
    } catch (error) {
      const axiosError = error as AxiosError;
      const providerMessage = parseProviderError(axiosError.response?.data);

      if (axiosError.response?.status === 401) {
        throw new Error(`Qwen API密钥无效，请检查 DASHSCOPE_API_KEY${providerMessage ? `: ${providerMessage}` : ''}`);
      }

      if (axiosError.response?.status === 400) {
        throw new Error(providerMessage || 'Qwen TTS 请求参数错误');
      }

      throw new Error(providerMessage || axiosError.message || 'Qwen TTS 请求失败');
    }
  }
}

export default new StepFunService();

