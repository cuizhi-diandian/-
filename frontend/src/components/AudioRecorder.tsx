import { useState, useRef } from 'react';
import { Button, message } from 'antd';
import { AudioOutlined, StopOutlined } from '@ant-design/icons';

interface AudioRecorderProps {
  onRecordComplete: (file: File) => void;
}

const AudioRecorder = ({ onRecordComplete }: AudioRecorderProps) => {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
        onRecordComplete(file);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
      };

      mediaRecorder.start();
      setRecording(true);
      setDuration(0);

      // 计时器
      timerRef.current = window.setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 1;
          // 限制在10秒
          if (newDuration >= 10) {
            stopRecording();
            message.info('录音已达到10秒上限');
          }
          return newDuration;
        });
      }, 1000);
    } catch (error) {
      message.error('无法访问麦克风，请检查权限设置');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  return (
    <div style={{ marginTop: '8px' }}>
      {!recording ? (
        <Button icon={<AudioOutlined />} onClick={startRecording}>
          开始录音
        </Button>
      ) : (
        <Button icon={<StopOutlined />} danger onClick={stopRecording}>
          停止录音 ({duration}s)
        </Button>
      )}
    </div>
  );
};

export default AudioRecorder;



