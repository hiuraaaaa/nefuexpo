// constants/tabConfig.ts
// ─────────────────────────────────────────────────────────────────────────────
// Satu sumber kebenaran (single source of truth) untuk semua konfigurasi tab.
// Menambah/menghapus tab cukup di sini — tidak perlu sentuh file lain.
// ─────────────────────────────────────────────────────────────────────────────

export type TabName = 'index' | 'explore' | 'news' | 'schedule' | 'profile';

export interface TabConfig {
  /** Nama route sesuai file di folder (tabs)/ */
  name: TabName;
  /** Label yang ditampilkan di bawah ikon saat tab aktif */
  label: string;
  /** Nama ikon Ionicons saat tab aktif */
  iconActive: string;
  /** Nama ikon Ionicons saat tab tidak aktif */
  iconInactive: string;
  /** Badge opsional — misalnya "NEW", "3", dll */
  badge?: string;
}

export const TABS: readonly TabConfig[] = [
  {
    name:         'index',
    label:        'Home',
    iconActive:   'home',
    iconInactive: 'home-outline',
  },
  {
    name:         'explore',
    label:        'Explore',
    iconActive:   'compass',
    iconInactive: 'compass-outline',
  },
  {
    name:         'news',
    label:        'News',
    iconActive:   'newspaper',
    iconInactive: 'newspaper-outline',
    badge:        'NEW',
  },
  {
    name:         'schedule',
    label:        'Schedule',
    iconActive:   'calendar',
    iconInactive: 'calendar-outline',
  },
  {
    name:         'profile',
    label:        'Profile',
    iconActive:   'person',
    iconInactive: 'person-outline',
  },
] as const;

// ── Dimensi & Layout ──────────────────────────────────────────────────────────
export const TAB_BAR = {
  /** Jarak melayang dari tepi layar (kiri, kanan, bawah) */
  FLOAT_MARGIN:  16,
  /** Tinggi total tab bar */
  HEIGHT:        58,
  /** Radius sudut tab bar (floating pill shape) */
  BORDER_RADIUS: 22,
  /** Radius pill highlight di belakang ikon aktif */
  PILL_RADIUS:   12,
  /** Lebar pill highlight */
  PILL_WIDTH:    48,
  /** Tinggi pill highlight */
  PILL_HEIGHT:   38,
} as const;

// ── Konfigurasi Animasi Spring ────────────────────────────────────────────────
export const SPRING_CONFIG = {
  /** Spring untuk skala ikon & pill — terasa "bouncy" tapi tidak berlebihan */
  ICON:  { damping: 14, stiffness: 200 } as const,
  /** Spring untuk translateY label */
  LABEL: { damping: 16, stiffness: 220 } as const,
} as const;

export const TIMING_CONFIG = {
  /** Durasi fade opacity label (ms) */
  LABEL_OPACITY: 150,
  /** Durasi fade opacity pill (ms) */
  PILL_OPACITY:  180,
} as const;

