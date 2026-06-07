# NefuSoft Anime

Aplikasi streaming anime gratis, tanpa iklan. Dibangun dengan React Native + Expo.

---

## Stack

| | |
|---|---|
| **Runtime** | Expo SDK 56 + React Native 0.85 |
| **Navigation** | expo-router 5 (file-based) |
| **Language** | TypeScript |
| **Styling** | NativeWind 4 (Tailwind CSS) |
| **Video** | expo-video (New Architecture) |
| **Storage** | react-native-mmkv |
| **Auth** | Firebase Auth + Google Sign-In |
| **Lists** | @shopify/flash-list |
| **API** | `https://dev.nefusoft.cloud` |

---

## Setup

```bash
# Install dependencies
npm install --legacy-peer-deps

# Jalankan dev server
npx expo start
```

Scan QR dengan Expo Go, atau build native:

```bash
npx expo run:android
```

---

## Build & Deploy

### OTA Update (tiap push ke `main`)
GitHub Actions otomatis push OTA via EAS Update ke channel `preview`.  
App yang sudah terinstall akan update otomatis saat dibuka.

### Build APK (tambahkan `[build]` di commit message)
```bash
git commit -m "feat: something [build]"
git push
```

### Build manual
```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

---

## Struktur Project

```
app/
  _layout.tsx              # Root layout + auth gate
  index.tsx                # Splash / redirect
  (tabs)/
    _layout.tsx            # Tab bar
    index.tsx              # Home — hero carousel, jadwal, ongoing
    explore.tsx            # Browse semua anime
    news.tsx               # MAL RSS news
    schedule.tsx           # Jadwal tayang mingguan
    history.tsx            # Riwayat tonton
    profile.tsx            # Profil + settings + tema
  watch/
    [slug].tsx             # Video player + daftar episode

components/
  AnimeCard.tsx            # Card anime (React.memo)
  SearchModal.tsx          # Global search
  Skeleton.tsx             # Loading skeletons
  TraceMoeModal.tsx        # Reverse image search anime
  DebugOverlay.tsx         # Dev overlay

hooks/
  api.ts                   # Semua API calls + helpers
  storage.ts               # MMKV (history, favorit, progress, settings)
  auth.ts                  # Firebase auth
  news.ts                  # MAL RSS parser
  theme.ts                 # Tema aktif
  xp.ts                    # XP / level system

constants/
  index.ts                 # Themes, warna, URL konstanta

types/
  index.ts                 # TypeScript interfaces
```

---

## CI/CD

| Trigger | Action |
|---|---|
| Push ke `main` | OTA update → channel `preview` |
| Commit mengandung `[build]` | Build APK via EAS |

Requires secret `EXPO_TOKEN` di GitHub repository settings.

---

## Catatan

- New Architecture (`newArchEnabled: true`) — wajib untuk `react-native-mmkv` v4+
- Storage pakai MMKV (synchronous), bukan AsyncStorage
- Video player `expo-video` + JSI — progress tracking tanpa bridge overhead
- OTA hanya apply ke bundle JS, perubahan native deps tetap perlu build ulang
