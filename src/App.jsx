
import Router from './router/Router';
import { Component, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { initPushNotifications } from './services/pushService';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    // Puedes enviar a un servicio de monitoreo aquí
    console.error('ErrorBoundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return <div style={{ padding: 32, textAlign: 'center' }}>Ha ocurrido un error inesperado.<br />Por favor, reinicia la app.</div>;
    }
    return this.props.children;
  }
}

const App = () => {
  useEffect(() => {
  if (Capacitor.isNativePlatform()) {
    // Mantener el splash al menos ~3 segundos para evitar el "flash" al abrir
    const splashTimeout = setTimeout(() => {
      SplashScreen.hide().catch((error) => {
        // No romper la app si falla el plugin
        console.error('[App] Error hiding splash screen:', error);
      });
    }, 3000);

    initPushNotifications().catch((error) => {
      console.error('[App] Error initializing push notifications:', error);
    });

    return () => {
      clearTimeout(splashTimeout);
    };
  }
  }, []);

  return (
    <ErrorBoundary>
      <Router />
    </ErrorBoundary>
  );
};

export default App;
