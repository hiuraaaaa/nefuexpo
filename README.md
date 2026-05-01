# NefuSoft Anime — React Native + TypeScript

Port dari [Nefusoft-ANIME-V1.1](https://github.com/hiuraaaaa/Nefusoft-ANIME-V1.1) ke Expo + React Native + TypeScript.

---

## Stack

- **Expo SDK 51** + **expo-router** (file-based routing)
- **React Native 0.74** + **TypeScript**
- **NativeWind 4** (Tailwind CSS untuk RN)
- **expo-av** (video player)
- **expo-screen-orientation** (fullscreen landscape)
- **AsyncStorage** (history & preferences)
- **API**: `https://api.nefusoft.cloud/v1` (sama persis dengan versi web)

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Install satu dependency tambahan yang perlu dicari manual

```bash
npx expo install @react-native-community/slider
```

### 3. Jalankan

```bash
npx expo start
```

Scan QR dengan Expo Go di HP, atau:

```bash
npx expo run:android   # build native Android
```

---

## Build APK

```bash
# Install EAS CLI dulu
npm install -g eas-cli

# Login ke Expo account
eas login

# Setup EAS project
eas build:configure

# Build APK
eas build --platform android --profile preview
```

Untuk build APK lokal (tanpa cloud):

```bash
npx expo run:android --variant release
```

---

## Struktur Project

```
app/
  _layout.tsx          # Root layout
  index.tsx            # Welcome screen
  (tabs)/
    _layout.tsx        # Tab bar
    index.tsx          # Home
    explore.tsx        # Explore + search + genre filter
    ongoing.tsx        # Ongoing anime
    schedule.tsx       # Jadwal tayang
    history.tsx        # Riwayat tonton
  watch/
    [slug].tsx         # Video player + episode list

components/
  AnimeCard.tsx        # Reusable card component
  SearchModal.tsx      # Global search modal

hooks/
  api.ts               # Semua API calls
  storage.ts           # AsyncStorage (history, preferences)

constants/
  index.ts             # Colors, API_BASE, dll

types/
  index.ts             # TypeScript interfaces
```

---

## Mapping Web → RN

| Web (React) | RN (Expo) |
|---|---|
| `BrowserRouter` | `expo-router` |
| `useNavigate` | `useRouter` |
| `<div>` | `<View>` |
| `<p>`, `<h1>` | `<Text>` |
| `<img>` | `<Image>` |
| `<input>` | `<TextInput>` |
| `<video>` | `expo-av Video` |
| Tailwind CSS | NativeWind |
| `localStorage` | `AsyncStorage` |
| `IntersectionObserver` | `FlatList` built-in |
| `window.scrollTo` | `ScrollView.scrollToOffset` |
| Canvas thumbnail | Removed (not supported) |

---

## Catatan

- Video player pakai `expo-av`, control manual (bukan native controls)
- Fullscreen pakai `expo-screen-orientation` → lock ke landscape
- History tersimpan di AsyncStorage, bukan memory
- Canvas thumbnail preview dari versi web dihapus (tidak ada equivalent sederhana di RN)
- API endpoint sama persis: `https://api.nefusoft.cloud/v1`
