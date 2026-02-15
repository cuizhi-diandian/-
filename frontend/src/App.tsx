import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Home from './pages/Home';
import CreateVoice from './pages/CreateVoice';
import VoiceDetail from './pages/VoiceDetail';
import TTSGeneration from './pages/TTSGeneration';
import MyVoices from './pages/MyVoices';
import Layout from './components/Layout';
import './App.css';

// 添加错误边界
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('React Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '50px', textAlign: 'center' }}>
          <h1 style={{ color: 'red' }}>出错了</h1>
          <p>{this.state.error?.toString()}</p>
          <button onClick={() => window.location.reload()}>刷新页面</button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  console.log('App component rendering...');
  
  return (
    <ErrorBoundary>
      <ConfigProvider locale={zhCN}>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/create" element={<CreateVoice />} />
              <Route path="/voices/:id" element={<VoiceDetail />} />
              <Route path="/tts" element={<TTSGeneration />} />
              <Route path="/my-voices" element={<MyVoices />} />
            </Routes>
          </Layout>
        </Router>
      </ConfigProvider>
    </ErrorBoundary>
  );
}

export default App;
