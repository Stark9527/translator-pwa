import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';
import { ConfigService } from './services/config/ConfigService';
import { AuthProvider } from './contexts/AuthContext';

// 初始化配置服务的跨标签页监听
ConfigService.listenToStorageChanges();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
