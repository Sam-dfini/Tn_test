import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { WebSocketProvider } from './context/WebSocketContext';

createRoot(document.getElementById('root')!).render(
  <WebSocketProvider>
    <App />
  </WebSocketProvider>,
);
