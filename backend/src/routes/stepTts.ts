import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { cloneVoice, generateSpeech } from '../services/ttsService';
import { sendSuccess, sendError } from '../utils/response';

const router = express.Router();

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    const uploadDir = process.env.STORAGE_PATH || path.join(__dirname, '../../uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({ storage });

router.post('/clone', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file?.path) {
      return sendError(res, '未上传音频文件', 400);
    }

    const result = await cloneVoice(req.file.path);
    return sendSuccess(res, result);
  } catch (error: any) {
    return sendError(res, error.message || '克隆失败', 500, error);
  }
});

router.post('/tts', async (req: Request, res: Response) => {
  try {
    const { voiceId, text } = req.body;

    if (!voiceId || !text) {
      return sendError(res, 'voiceId 和 text 是必填项', 400);
    }

    const result = await generateSpeech(String(voiceId), String(text));
    return sendSuccess(res, result);
  } catch (error: any) {
    return sendError(res, error.message || 'TTS 生成失败', 500, error);
  }
});

export default router;
