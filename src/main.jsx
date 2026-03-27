window.onerror = (msg, url, line, col, error) => {
  // Puedes enviar a un servicio o mostrar un fallback global aquí si lo deseas
  console.error('Global error:', msg, url, line, col, error);
};
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import './styles/card.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
