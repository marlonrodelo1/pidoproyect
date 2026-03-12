import { useEffect, useState } from 'react';
import { loadNotifications, markAsRead } from '../services/notificationService';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchAndMark = async () => {
      const data = await loadNotifications();
      setNotifications(data);
      await markAsRead();
    };

    fetchAndMark();
  }, []);

  return (
    <div className="notifications-page">
      <h2>🔔 Notificaciones</h2>

      {notifications.length === 0 && (
        <p>No tienes notificaciones aún</p>
      )}

      {notifications.map((n) => (
        <div key={n.id} className="notification-card">
          <div className="notification-title">
            {n.title}
          </div>

          <div className="notification-body">
            {n.body}
          </div>

          <div className="notification-date">
            {new Date(n.created_at).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
