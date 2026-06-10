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

  // Skip kalau waktunya udah lewat
  if (triggerDate <= now) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🎌 Anime Baru Tersedia',
      body:  `${anime.title} sudah bisa ditonton!`,
      data:  {
        group: NOTIF_GROUP,
        slug:  getAnimeSlug(anime),
        url:   `/watch/${getAnimeSlug(anime)}`,
      },
      // Group notif per hari di Android
      ...(({ categoryIdentifier: NOTIF_GROUP }) as any),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });
};

// ─── Main: reschedule semua notif jadwal ──────────────────────────────────────
// Dipanggil tiap app buka
// Fetch jadwal → filter hari ini + besok → schedule notif per anime

export const rescheduleNotifs = async (): Promise<void> => {
  try {
    const granted = await requestNotifPermission();
    if (!granted) return;

    // Cancel semua notif lama dulu
    await cancelScheduleNotifs();

    // Fetch jadwal
    const res = await api.schedule();
    if (!res.data) return;

    const now       = new Date();
    const today     = now.toDateString();
    const tomorrow  = new Date(now.getTime() + 86400000).toDateString();

    const animeToSchedule: { anime: Anime; ts: number }[] = [];

    for (const dayAnimes of Object.values(res.data)) {
      for (const anime of dayAnimes) {
        if (!anime.updated) continue;

        const animeDate = new Date(anime.updated * 1000).toDateString();

        // Hanya hari ini + besok
        if (animeDate !== today && animeDate !== tomorrow) continue;

        animeToSchedule.push({ anime, ts: anime.updated });
      }
    }

    // Schedule semua
    await Promise.all(
      animeToSchedule.map(({ anime, ts }) => scheduleAnimeNotif(anime, ts))
    );

    console.log(`[Notif] Scheduled ${animeToSchedule.length} notifications`);
  } catch (e) {
    console.warn('[Notif] rescheduleNotifs error:', e);
  }
};

// ─── Handle tap notif → navigate ─────────────────────────────────────────────
// Pasang listener ini di _layout.tsx

export const useNotifTapHandler = (router: any) => {
  Notifications.addNotificationResponseReceivedListener(response => {
    const url = response.notification.request.content.data?.url as string | undefined;
    if (url) router.push(url);
  });
};

