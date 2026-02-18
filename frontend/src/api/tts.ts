import apiClient from './client';

export interface GenerateTTSRequest {
  voiceId: string;
  text: string;
}

export interface TTSResponse {
  success: boolean;
  data: {
    audioUrl?: string;
    audioBase64?: string;
    duration?: number;
  };
  message?: string;
}

export const generateTTS = async (data: GenerateTTSRequest): Promise<TTSResponse> => {
  return apiClient.post('/tts', data);
};
