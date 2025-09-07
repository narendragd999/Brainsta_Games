# Reels — 30s GameReels (Starter)

This is a ready-to-run Expo + TypeScript starter that shows vertical "reels" where each reel loads an HTML5 game inside a WebView.

Features included:
- Vertical, full-screen reels using FlatList with pagingEnabled
- Each reel loads an HTML5 game in a WebView
- 30-second auto-advance timer per reel
- Favorite (heart) toggle saved to AsyncStorage
- On-webview postMessage listener to receive events from games (e.g., GAME_OVER)
- Simple placeholder Firebase config file (replace with your keys to enable Auth/Firestore)
- Instructions to host games locally (dev) and on Firebase Hosting / Netlify (prod)

## Setup

1. Install Expo CLI (if you haven't):
```bash
npm install -g expo-cli
```

2. Create project (or unzip this into a folder) and install dependencies:
```bash
npm install
npx expo install react-native-webview @react-native-async-storage/async-storage react-native-safe-area-context
```

3. Start dev server:
```bash
npx expo start
```

4. For game URLs in `App.tsx`, replace `SAMPLE_GAMES` URLs with your hosted game URLs.
   For local testing, host your `games/` folder using `http-server` or `live-server` on your PC and use your LAN IP.

## Notes
- To enable Firebase features, replace `firebaseConfig.ts` placeholders with your Firebase project config and follow Firebase setup instructions in the comments.
- WebView is heavy: for better performance render only current + next, and unmount distant WebViews.

Enjoy — test on a device with Expo Go on the same LAN so WebView can load local hosted HTML files.
