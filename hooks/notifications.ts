import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { api } from '@/hooks/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge:  false,
  }),
});

const NOTIF_GROUP = 'nefusoft-schedule';

export const requestNotifPermission = async (): Promise<boolean> => {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

export const cancelScheduleNotifs = async (): Promise<void> => {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const ids = scheduled
    .filter(n => n.content.data?.group === NOTIF_GROUP)
    .map(n => n.identifier);
  await Promise.all(ids.map(id => Notifications.cancelScheduledNotificationAsync(id)));
};

export const sendTestNotif = async (): Promise<void> => {
  const granted = await requestNotifPermission();
  if (!granted) {
    console.log('[Notif] Permission denied');
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🎌 Test Notifikasi',
      body:  'Kalau ini muncul, notif berfungsi dengan baik!',
      data:  { group: NOTIF_GROUP, url: '/' },
    },
    trigger: {
      type:    Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
    },
  });

  console.log('[Notif] Test notif scheduled, tunggu 5 detik...');
};

export const rescheduleNotifs = async (): Promise<void> => {
  try {
    const granted = await requestNotifPermission();
    console.log('[Notif] Permission granted:', granted);
    if (!granted) return;

    await cancelScheduleNotifs();

    const res = await api.schedule();
    if (!res.data) return;

    const now   = new Date();
    let   count = 0;

    for (const animeList of Object.values(res.data)) {
      for (const anime of animeList) {
        const updated = (anime as any).updated;
        if (!updated) {
          console.log('[Notif] SKIP - no updated:', anime.title);
          continue;
        }

        const triggerDate = new Date(updated * 1000);

        if (triggerDate <= now) {
          console.log('[Notif] SKIP - sudah lewat:', anime.title, triggerDate.toISOString());
          continue;
        }

        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🎌 Anime Baru Tersedia',
            body:  `${anime.title} sudah bisa ditonton!`,
            data:  {
              group: NOTIF_GROUP,
              url:   `/watch/${(anime as any).id}`,
            },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: triggerDate,
          },
        });

        console.log('[Notif] Scheduled:', anime.title, '->', triggerDate.toISOString());
        count++;
      }
    }

    console.log('[Notif] Done scheduling', count, 'notifications');
  } catch (e) {
    console.warn('[Notif] ERROR:', e);
  }
};

export const useNotifTapHandler = (router: any) => {
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const url = response.notification.request.content.data?.url as string | undefined;
      console.log('[Notif] Tap received, url:', url);
      if (url) router.push(url);
    });
    return () => sub.remove();
  }, []);
};
