/**
 * prefetch.ts — Simple in-memory cache untuk home data.
 * Diisi dari welcome/index screen, dibaca di home screen.
 * Otomatis expired setelah 5 menit biar ga stale.
 */

import { api } from '@/hooks/api';

const TTL_MS = 5 * 60 * 1000; // 5 menit

type HomeCache = {
  ongoing:    any[];
  movies:     any[];
  schedule:   any;
  fetchedAt:  number;
};

let cache: HomeCache | null = null;
let inflight: Promise<void> | null = null;

/** Mulai prefetch di background. Aman dipanggil berkali-kali (idempotent). */
export const prefetchHome = (): void => {
  // Kalau cache masih fresh atau lagi fetch, skip
  if (cache && Date.now() - cache.fetchedAt < TTL_MS) return;
  if (inflight) return;

  inflight = api.home()
    .then(([schedRes, ongRes, movRes]) => {
      cache = {
        ongoing:   ongRes.data   || [],
        movies:    movRes.data   || [],
        schedule:  schedRes.data || {},
        fetchedAt: Date.now(),
      };
    })
    .catch(() => {})
    .finally(() => { inflight = null; });
};

/** Ambil cache kalau ada dan masih fresh. Return null kalau belum siap. */
export const getHomeCache = (): HomeCache | null => {
  if (!cache) return null;
  if (Date.now() - cache.fetchedAt > TTL_MS) {
    cache = null;
    return null;
  }
  return cache;
};

/** Tunggu prefetch selesai, return cache. Fallback null kalau gagal/timeout. */
export const waitHomeCache = async (timeoutMs = 3000): Promise<HomeCache | null> => {
  if (cache && Date.now() - cache.fetchedAt < TTL_MS) return cache;
  if (!inflight) return null;
  try {
    await Promise.race([
      inflight,
      new Promise<void>(res => setTimeout(res, timeoutMs)),
    ]);
    return getHomeCache();
  } catch {
    return null;
  }
};

/** Clear cache (misal setelah pull-to-refresh). */
export const clearHomeCache = (): void => { cache = null; };
