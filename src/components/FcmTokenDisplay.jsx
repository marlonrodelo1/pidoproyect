import { useEffect, useState } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { currentFcmToken } from '../services/pushService';

const FcmTokenDisplay = () => {
  const [token, setToken] = useState(currentFcmToken);

  useEffect(() => {
    const listener = PushNotifications.addListener('registration', (registration) => {
      setToken(registration.value);
    });

    return () => {
      if (listener && typeof listener.remove === 'function') {
        listener.remove();
      }
    };
  }, []);

  if (!token) {
    return null;
  }

  return (
    <div style={styles.container}>
      <div style={styles.label}>FCM TOKEN:</div>
      <div style={styles.token}>{token}</div>
    </div>
  );
};

const styles = {
  container: {
    marginTop: 16,
    padding: 10,
    borderRadius: 8,
    background: 'rgba(15, 23, 42, 0.8)',
    color: '#e5e7eb',
    fontSize: '0.78rem',
    wordBreak: 'break-all',
  },
  label: {
    fontWeight: 600,
    marginBottom: 4,
  },
  token: {
    fontFamily: 'monospace',
    fontSize: '0.72rem',
  },
};

export default FcmTokenDisplay;
