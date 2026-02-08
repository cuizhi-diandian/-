import { useState, useEffect } from 'react';
import { Card, Input, Select, Button, message, Space, Row, Col, Divider } from 'antd';
import { SoundOutlined, DownloadOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { generateTTS } from '../api/tts';
import { listVoices, type Voice } from '../api/voices';

const { TextArea } = Input;
const { Option } = Select;

const TTSGeneration = () => {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('');
  const [model, setModel] = useState('step-tts-mini');
  const [inputText, setInputText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);

  useEffect(() => {
    loadVoices();
  }, []);

  const loadVoices = async () => {
    try {
      const response = await listVoices();
      if (response.success) {
        setVoices(response.data.voices);
      }
    } catch (error) {
      console.error('加载角色列表失败:', error);
    }
  };

  const handleGenerate = async () => {
    if (!selectedVoiceId) {
      message.error('请选择Voice');
      return;
    }
    if (!inputText.trim()) {
      message.error('请输入文本');
      return;
    }

    setGenerating(true);
    try {
      const response = await generateTTS({
        voiceId: selectedVoiceId,
        input: inputText,
        model,
      });

      if (response.success) {
        if (response.data.audioUrl) {
          setAudioUrl(response.data.audioUrl);
        }
        if (response.data.audioBase64) {
          setAudioBase64(response.data.audioBase64);
        }
        message.success('生成成功！');
      }
    } catch (error: any) {
      message.error(error.message || '生成失败');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (audioUrl) {
      window.open(audioUrl, '_blank');
    } else if (audioBase64) {
      const link = document.createElement('a');
      link.href = `data:audio/mp3;base64,${audioBase64}`;
      link.download = 'tts-output.mp3';
      link.click();
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* 示例展示区域 */}
      <Card 
        title={
          <span>
            <PlayCircleOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
            效果示例
          </span>
        }
        style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        headStyle={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.2)' }}
        bodyStyle={{ background: '#fff' }}
      >
        <div style={{ padding: '16px 0' }}>
          <div style={{ marginBottom: '16px', fontSize: '14px', color: '#666' }}>
            以下是语音克隆效果对比示例，展示原始音频与克隆后的音频效果
          </div>
          
          <Row gutter={24}>
            {/* 原始音频 */}
            <Col xs={24} md={12}>
              <Card 
                size="small" 
                title="原始音频"
                style={{ height: '100%' }}
                headStyle={{ background: '#f0f2f5', fontWeight: 'bold' }}
              >
                <div style={{ padding: '16px 0' }}>
                  <div style={{ marginBottom: '12px', color: '#666' }}>
                    <strong>说话人：</strong>MCY
                  </div>
                  <div style={{ marginBottom: '12px', color: '#666' }}>
                    <strong>时长：</strong>约 5 秒
                  </div>
                  <div style={{ 
                    marginBottom: '12px', 
                    padding: '8px', 
                    background: '#fafafa', 
                    borderLeft: '3px solid #1890ff',
                    fontSize: '13px',
                    color: '#333'
                  }}>
                    <strong>文本：</strong>"欢迎来到周周黑客松，来开始你的表演吧"
                  </div>
                  <audio 
                    controls 
                    style={{ width: '100%' }}
                    preload="metadata"
                  >
                    <source src="/mcy.wav" type="audio/wav" />
                    您的浏览器不支持音频播放
                  </audio>
                </div>
              </Card>
            </Col>

            {/* 克隆音频 */}
            <Col xs={24} md={12}>
              <Card 
                size="small" 
                title="克隆后音频"
                style={{ height: '100%' }}
                headStyle={{ background: '#e6f7ff', fontWeight: 'bold', color: '#1890ff' }}
              >
                <div style={{ padding: '16px 0' }}>
                  <div style={{ marginBottom: '12px', color: '#666' }}>
                    <strong>克隆模型：</strong>Codec 模型
                  </div>
                  <div style={{ marginBottom: '12px', color: '#666' }}>
                    <strong>效果：</strong>高度还原
                  </div>
                  <div style={{ 
                    marginBottom: '12px', 
                    padding: '8px', 
                    background: '#f6ffed', 
                    borderLeft: '3px solid #52c41a',
                    fontSize: '13px',
                    color: '#333',
                    lineHeight: '1.6'
                  }}>
                    <strong>文本：</strong>"一个让克隆声音真正活起来的智能人格语音生态：带情绪、长期记忆、互动体验与场景化价值。"
                  </div>
                  <audio 
                    controls 
                    style={{ width: '100%' }}
                    preload="metadata"
                  >
                    <source src="/mcy-clone.wav" type="audio/wav" />
                    您的浏览器不支持音频播放
                  </audio>
                </div>
              </Card>
            </Col>
          </Row>

          <div style={{ 
            marginTop: '16px', 
            padding: '12px', 
            background: '#f6ffed', 
            border: '1px solid #b7eb8f',
            borderRadius: '4px',
            fontSize: '13px',
            color: '#52c41a'
          }}>
            💡 提示：通过上传您的音频样本，系统可以生成与您声音相似的语音角色
          </div>
        </div>
      </Card>

      <Divider />

      {/* TTS 生成区域 */}
      <Card title="TTS音频生成">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <div style={{ marginBottom: '8px' }}>选择Voice</div>
            <Select
              value={selectedVoiceId}
              onChange={setSelectedVoiceId}
              style={{ width: '100%' }}
              placeholder="请选择语音角色"
              showSearch
              filterOption={(input, option) =>
                (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
              }
            >
              {voices.map((voice) => (
                <Option key={voice.id} value={voice.id}>
                  {voice.id.slice(0, 8)}... ({voice.model})
                </Option>
              ))}
            </Select>
          </div>

          <div>
            <div style={{ marginBottom: '8px' }}>模型选择</div>
            <Select value={model} onChange={setModel} style={{ width: '100%' }}>
              <Option value="step-tts-2">step-tts-2</Option>
              <Option value="step-tts-mini">step-tts-mini</Option>
              <Option value="step-tts-vivid">step-tts-vivid</Option>
              <Option value="step-audio-2">step-audio-2</Option>
            </Select>
          </div>

          <div>
            <div style={{ marginBottom: '8px' }}>输入文本</div>
            <TextArea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="请输入要转换为语音的文本"
              rows={6}
            />
          </div>

          <Button
            type="primary"
            size="large"
            icon={<SoundOutlined />}
            onClick={handleGenerate}
            loading={generating}
            block
          >
            生成音频
          </Button>

          {(audioUrl || audioBase64) && (
            <Card title="生成结果">
              <audio
                controls
                style={{ width: '100%', marginBottom: '16px' }}
                src={audioUrl || `data:audio/mp3;base64,${audioBase64}`}
              />
              <Button icon={<DownloadOutlined />} onClick={handleDownload}>
                下载音频
              </Button>
            </Card>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default TTSGeneration;



