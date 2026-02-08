import { Layout as AntLayout, Menu } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { HomeOutlined, PlusOutlined, SoundOutlined, UserOutlined } from '@ant-design/icons';
import { ReactNode } from 'react';

const { Header, Content, Footer } = AntLayout;

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: <Link to="/">发现</Link>,
    },
    {
      key: '/create',
      icon: <PlusOutlined />,
      label: <Link to="/create">创建角色</Link>,
    },
    {
      key: '/tts',
      icon: <SoundOutlined />,
      label: <Link to="/tts">TTS生成</Link>,
    },
    {
      key: '/my-voices',
      icon: <UserOutlined />,
      label: <Link to="/my-voices">我的角色</Link>,
    },
  ];

  return (
    <AntLayout style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      <Header style={{ display: 'flex', alignItems: 'center', background: '#001529', height: '64px' }}>
        <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', marginRight: '40px' }}>
          本周之声
        </div>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ flex: 1, minWidth: 0, lineHeight: '64px' }}
        />
      </Header>
      <Content style={{ padding: '24px', background: '#f0f2f5', minHeight: 'calc(100vh - 128px)' }}>
        {children}
      </Content>
      <Footer style={{ textAlign: 'center', background: '#fff', padding: '16px' }}>
        本周之声 ©2024
      </Footer>
    </AntLayout>
  );
};

export default Layout;
