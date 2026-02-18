import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import stepfunService from './stepfunService';
import { memoryStorage, Voice } from '../storage/memoryStorage';

const TTS_OUTPUT_DIR = process.env.STORAGE_PATH
  ? path.join(process.env.STORAGE_PATH, 'tts_outputs')
  : path.join(__dirname, '../../tts_outputs');

const STEP_CLONE_MODEL = process.env.STEP_CLONE_MODEL || 'step-voice-clone';
const STEP_TTS_MODEL = process.env.STEP_TTS_MODEL || 'step-tts-2';

(async () => {
  await fs.mkdir(TTS_OUTPUT_DIR, { recursive: true });
})();

const saveVoiceRecord = (stepVoiceId: string): Voice => {
  const id = uuidv4();
  const now = new Date();

  const voice: Voice = {
    id,
    userId: 'default-user',
    stepVoiceId,
    fileId: `stepfun-${id}`,
    model: STEP_CLONE_MODEL,
    embeddingHash: 'stepfun-managed',
    metadata: { source: 'stepfun' },
    createdAt: now,
    updatedAt: now,
  };

  memoryStorage.saveVoice(voice);
  return voice;
};

const resolveStepVoiceId = (voiceId: string): string => {
  const existing = memoryStorage.getVoice(voiceId);
  return existing?.stepVoiceId || voiceId;
};

export const cloneVoice = async (audioFile: string): Promise<{ voiceId: string; stepVoiceId: string }> => {
  const uploaded = await stepfunService.uploadAudioFile(audioFile);
  const cloned = await stepfunService.cloneVoice({
    fileId: uploaded.id,
    model: STEP_CLONE_MODEL,
  });

  const voice = saveVoiceRecord(cloned.id);
  return { voiceId: voice.id, stepVoiceId: cloned.id };
};

export const generateSpeech = async (voiceId: string, text: string): Promise<{ audioUrl: string; audioPath: string }> => {
  const stepVoiceId = resolveStepVoiceId(voiceId);

  const audioBuffer = await stepfunService.generateSpeech({
    input: text,
    voice: stepVoiceId,
    model: STEP_TTS_MODEL,
  });

  const filePath = path.join(TTS_OUTPUT_DIR, `${voiceId}_${Date.now()}.mp3`);
  await fs.writeFile(filePath, audioBuffer);

  return {
    audioUrl: `/api/files/tts/${path.basename(filePath)}`,
    audioPath: filePath,
  };
};
