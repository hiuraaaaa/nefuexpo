import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { api, getAnimeSlug } from '@/hooks/api';
import { Anime } from '@/types';

// ─── Config ───────────────────────────────────────────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge:  false,
  }),
});

const NOTIF_GROUP = 'nefusoft-schedule';

// ─── Permission ───────────────────────────────────────────────────────────────

export const requestNotifPermission = async (): Promise<boolean> => {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

// ─── Cancel semua notif jadwal ────────────────────────────────────────────────

export const cancelScheduleNotifs = async (): Promise<void> => {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const ids = scheduled
    .filter(n => n.content.data?.group === NOTIF_GROUP)
    .map(n => n.identifier);
  await Promise.all(ids.map(id => Notifications.cancelScheduledNotificationAsync(id)));
};

// ─── Schedule notif untuk satu anime ─────────────────────────────────────────

const scheduleAnimeNotif = async (anime: Anime, triggerTs: number): Promise<void> => {
  const triggerDate = new Date(triggerTs * 1000);
  const now         = new Date();

  if (triggerDate <= now) {
    console.log('[Notif] SKIP - waktu sudah lewat:', anime.title, triggerDate.toISOString());
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🎌 Anime Baru Tersedia',
      body:  `${anime.title} sudah bisa ditonton!`,
      data:  {
        group: NOTIF_GROUP,
        slug:  getAnimeSlug(anime),
        url:   `/watch/${getAnimeSlug(anime)}`,
      },
      ...(({ categoryIdentifier: NOTIF_GROUP }) as any),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });

  console.log('[Notif] Scheduled:', anime.title, '->', triggerDate.toISOString());
};

// ─── Main: reschedule semua notif jadwal ──────────────────────────────────────

export const rescheduleNotifs = async (): Promise<void> => {
  try {
    const granted = await requestNotifPermission();
    console.log('[Notif] Permission granted:', granted);
    if (!granted) return;

    await cancelScheduleNotifs();

    const res = await api.schedule();
    console.log('[Notif] Schedule data sample:', JSON.stringify(res.data).slice(0, 300));
    if (!res.data) return;

    const now      = new Date();
    const today    = now.toDateString();
    const tomorrow = new Date(now.getTime() + 86400000).toDateString();

    console.log('[Notif] Today:', today, '| Tomorrow:', tomorrow);

    const animeToSchedule: { anime: Anime; ts: number }[] = [];

    for (const dayAnimes of Object.values(res.data)) {
      for (const anime of dayAnimes) {
        if (!anime.updated) {
          console.log('[Notif] SKIP - no updated field:', anime.title);
          continue;
        }

        const animeDate = new Date(anime.updated * 1000).toDateString();

        if (animeDate !== today && animeDate !== tomorrow) {
          console.log('[Notif] SKIP - bukan hari ini/besok:', anime.title, animeDate);
          continue;
        }

        console.log('[Notif] QUEUED:', anime.title, '->', animeDate);
        animeToSchedule.push({ anime, ts: anime.updated });
      }
    }

    console.log('[Notif] Total to schedule:', animeToSchedule.length);

    await Promise.all(
      animeToSchedule.map(({ anime, ts }) => scheduleAnimeNotif(anime, ts))
    );

    console.log('[Notif] Done scheduling', animeToSchedule.length, 'notifications');
  } catch (e) {
    console.warn('[Notif] ERROR:', e);
  }
};

// ─── Handle tap notif → navigate ─────────────────────────────────────────────

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
