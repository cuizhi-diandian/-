import axios, { AxiosError } from 'axios';

const STEP_API_BASE_URL = 'https://api.stepfun.com/v1';

// 动态获取 API Key 的函数
const getApiKey = (): string => {
  const apiKey = process.env.STEP_API_KEY;
  if (!apiKey) {
    throw new Error('STEP_API_KEY is not configured');
  }
  return apiKey;
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

  /**
   * 生成TTS音频
   */
  async generateSpeech(request: GenerateSpeechRequest): Promise<Buffer> {
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
}

export default new StepFunService();



