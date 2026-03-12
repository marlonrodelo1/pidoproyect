import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '../ services/supabaseClient';

export let currentFcmToken = null;

export const initPushNotifications = async () => {
  console.log('[Push] Solicitando permisos de notificaciones...');
  const permission = await PushNotifications.requestPermissions();
  console.log('[Push] Estado de permisos:', permission.receive);

  if (permission.receive === 'denied') {
    console.log('[Push] Permiso de notificaciones denegado');
    return;
  }

  try {
    console.log('[Push] Registrando dispositivo para notificaciones push...');
    await PushNotifications.register();
    console.log('[Push] Dispositivo registrado para notificaciones push');
  } catch (error) {
    console.error('[Push] Error durante el registro de notificaciones:', error);
  }

  PushNotifications.addListener('registration', async (token) => {
    console.log('🔥 FCM TOKEN:', token.value);
    currentFcmToken = token.value;

    if (!supabase) {
      console.error('Supabase client is not initialized; cannot store device token');
      return;
    }

    try {
      console.log('[Push] Guardando token en Supabase...');
      const { error } = await supabase
        .from('device_tokens')
        .insert([{ token: token.value }]);
      if (error) {
        console.error('Error guardando token:', error);
      } else {
        console.log('[Push] Token guardado correctamente en Supabase');
      }
    } catch (error) {
      console.error('Error guardando token de dispositivo en Supabase:', error);
    }
  });

  PushNotifications.addListener('registrationError', (err) => {
    console.error('Push registration error:', err);
  });

  PushNotifications.addListener('pushNotificationReceived', async (notification) => {
    console.log('Push recibida:', notification);

    if (!supabase) {
      console.error('Supabase client is not initialized; cannot store notification');
      return;
    }

    try {
      const title = notification.title ?? notification.data?.title ?? 'Notificación';
      const body = notification.body ?? notification.data?.body ?? '';
      const type = notification.data?.type || 'general';

      await supabase
        .from('notifications')
        .insert({
          title,
          body,
          type,
        });
    } catch (error) {
      console.error('Error guardando notificación en Supabase:', error);
    }
  });

  PushNotifications.addListener('pushNotificationActionPerformed', async (event) => {
    console.log('Push abierta:', event);

    if (!supabase) {
      console.error('Supabase client is not initialized; cannot store notification (actionPerformed)');
      return;
    }

    try {
      const notif = event.notification || {};
      const title = notif.title ?? notif.data?.title ?? 'Notificación';
      const body = notif.body ?? notif.data?.body ?? '';
      const type = notif.data?.type || 'general';

      await supabase
        .from('notifications')
        .insert({
          title,
          body,
          type,
        });
    } catch (error) {
      console.error('Error guardando notificación (actionPerformed) en Supabase:', error);
    }
  });
};
