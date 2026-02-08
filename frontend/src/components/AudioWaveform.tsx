import { useEffect, useRef, useState } from 'react';

interface AudioWaveformProps {
  file: File;
}

const AudioWaveform = ({ file }: AudioWaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [duration, setDuration] = useState<number>(0);

  useEffect(() => {
    if (!file || !canvasRef.current) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const fileReader = new FileReader();

    fileReader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      audioContext.decodeAudioData(arrayBuffer).then((audioBuffer) => {
        setDuration(audioBuffer.duration);

        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#1890ff';

        const data = audioBuffer.getChannelData(0);
        const step = Math.ceil(data.length / width);
        const amp = height / 2;

        for (let i = 0; i < width; i++) {
          let min = 1.0;
          let max = -1.0;
          for (let j = 0; j < step; j++) {
            const datum = data[i * step + j];
            if (datum < min) min = datum;
            if (datum > max) max = datum;
          }
          ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
        }
      });
    };

    fileReader.readAsArrayBuffer(file);
  }, [file]);

  return (
    <div>
      <canvas ref={canvasRef} width={400} height={100} style={{ width: '100%', maxWidth: '400px' }} />
      {duration > 0 && (
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
          时长: {duration.toFixed(2)}秒
          {duration < 1 && <span style={{ color: 'red' }}> (时长过短，建议1-10秒)</span>}
          {duration >= 1 && duration <= 10 && <span style={{ color: 'green' }}> ✓ 时长合适</span>}
          {duration > 10 && <span style={{ color: 'orange' }}> (超过10秒，建议裁剪)</span>}
        </div>
      )}
    </div>
  );
};

export default AudioWaveform;



