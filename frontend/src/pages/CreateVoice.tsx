import { useState } from 'react';
import {
  Card,
  Upload,
  Button,
  Progress,
  message,
  Space,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { uploadFile } from '../api/files';
import { createVoice } from '../api/voices';
import AudioRecorder from '../components/AudioRecorder';
import AudioWaveform from '../components/AudioWaveform';

type ProcessingStep = 'upload' | 'processing' | 'complete';

const CreateVoice = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<ProcessingStep>('upload');
  const [voiceResult, setVoiceResult] = useState<any>(null);

  const handleFileSelect = (file: File) => {
    // 格式校验
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/webm'];
    if (!validTypes.includes(file.type)) {
      message.error('只支持 MP3、WAV 或 WebM 格式');
      return false;
    }

    // 大小限制
    if (file.size > 10 * 1024 * 1024) {
      message.error('文件大小不能超过 10MB');
      return false;
    }

    setFile(file);
    setVoiceResult(null); // 清除之前的结果
    return false; // 阻止自动上传
  };

  const handleCreateVoice = async () => {
    if (!file) {
      message.error('请先选择或录制音频文件');
      return;
    }

    setProcessing(true);
    setCurrentStep('upload');

    try {
      // 1. 上传文件
      const uploadResponse = await uploadFile(file, (progressEvent) => {
        const percent = progressEvent.total
          ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
          : 0;
        setUploadProgress(percent);
      });

      if (!uploadResponse.success) {
        throw new Error('文件上传失败');
      }

      setCurrentStep('processing');

      // 2. 创建语音角色（自动生成 embedding）
      const voiceResponse = await createVoice({
        fileId: uploadResponse.data.fileId,
        model: 'codec', // 使用 Codec 模型
      });

      if (voiceResponse.success) {
        setCurrentStep('complete');
        setVoiceResult(voiceResponse.data);
        message.success('语音角色创建成功！');
      }
    } catch (error: any) {
      message.error(error.message || '创建失败');
      setCurrentStep('upload');
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setVoiceResult(null);
    setCurrentStep('upload');
    setUploadProgress(0);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <Card title="创建语音角色">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 音频上传/录音区域 */}
          <div>
            <div style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 500 }}>
              上传或录制音频（1-10秒）
            </div>
            
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Upload
                beforeUpload={handleFileSelect}
                accept="audio/mpeg,audio/wav,audio/mp3,audio/webm"
                showUploadList={false}
                disabled={processing}
              >
                <Button icon={<UploadOutlined />} disabled={processing}>
                  选择音频文件
                </Button>
              </Upload>

              <AudioRecorder 
                onRecordComplete={(recordedFile) => {
                  setFile(recordedFile);
                  setVoiceResult(null);
                }} 
              />
            </Space>

            {file && (
              <div style={{ marginTop: '16px', padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong>文件名:</strong> {file.name}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>大小:</strong> {(file.size / 1024).toFixed(2)} KB
                </div>
                <AudioWaveform file={file} />
              </div>
            )}

            {processing && currentStep === 'upload' && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ marginBottom: '8px' }}>上传中...</div>
                <Progress percent={uploadProgress} />
              </div>
            )}

            {processing && currentStep === 'processing' && (
              <div style={{ marginTop: '16px' }}>
                <Progress percent={100} status="active" />
                <div style={{ marginTop: '8px', textAlign: 'center', color: '#1890ff' }}>
                  正在生成语音角色...
                </div>
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          {!voiceResult && (
            <Button
              type="primary"
              size="large"
              onClick={handleCreateVoice}
              loading={processing}
              disabled={!file || processing}
              block
            >
              {processing ? '创建中...' : '创建语音角色'}
            </Button>
          )}

          {/* 创建成功结果 */}
          {voiceResult && (
            <Card 
              title="✓ 创建成功" 
              style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div>
                  <strong>Voice ID:</strong> 
                  <div style={{ 
                    marginTop: '4px', 
                    padding: '8px', 
                    background: '#fff', 
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    wordBreak: 'break-all'
                  }}>
                    {voiceResult.voiceId}
                  </div>
                </div>

                <div>
                  <strong>Embedding Hash:</strong>
                  <div style={{ 
                    marginTop: '4px', 
                    padding: '8px', 
                    background: '#fff', 
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    wordBreak: 'break-all'
                  }}>
                    {voiceResult.embeddingHash}
                  </div>
                </div>

                {voiceResult.sampleAudio && (
                  <div>
                    <strong>试听音频:</strong>
                    <audio 
                      controls 
                      src={`data:audio/wav;base64,${voiceResult.sampleAudio}`}
                      style={{ width: '100%', marginTop: '8px' }}
                    />
                  </div>
                )}

                <Button type="primary" onClick={handleReset} block>
                  创建新角色
                </Button>
              </Space>
            </Card>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default CreateVoice;



