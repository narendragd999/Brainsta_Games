
Fruit Slice - Server-ready package
---------------------------------
This package is optimized for hosting on a server and running inside an Android/iOS WebView (app wrapper).
What I changed to make it WebView-friendly:
- Responsive canvas that fills the WebView viewport and accounts for devicePixelRatio.
- Pointer + Touch + Mouse event handling (covers modern WebViews and older ones that lack Pointer events).
- Audio unlocking on first user interaction (required in many WebViews).
- Start/Retry buttons listen for both click and touchstart events.
- All files are at the root for easy deployment: index.html, style.css, main.js, README.txt, assets/*

How to deploy:
1. Upload the ZIP contents to your server (place files at the web root or a folder).
2. In your app WebView load the hosted URL (e.g., https://yourserver.com/fruit/).
3. Ensure the WebView allows JavaScript and audio playback (typical WebView settings).
4. If audio still doesn't play inside your app, call a small JS bridge on first tap to resume audio context or ensure the WebView's mediaSettings allow autoplay after user gesture.

Notes / Troubleshooting:
- If your app uses an iframe or redirect, make sure headers don't block autoplay or pointer events; it's best to load the game URL directly inside the WebView.
- If you want me to produce an APK wrapper that bundles the web files locally (so no network needed), say "APK chahiye" and I'll prepare a build-ready template.
