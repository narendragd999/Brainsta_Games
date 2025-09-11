Coin Jump - mobile-friendly game
Files included (all at root):
- index.html
- style.css
- main.js
- char.png
- bg.png

How to use:
1. Extract the zip to your web server root (all files are in root).
2. Open index.html on mobile. Game locks zoom and fits the screen.
3. Tap the screen to jump. As your score increases, jump strength increases a little so you go higher.
4. If you want PNGs replaced, swap char.png and bg.png in the same folder (keep names).

Notes on responsiveness and zoom lock:
- Uses <meta name="viewport" ... user-scalable=no> to lock zoom on most mobile browsers.
- Uses touch-action:none and prevents gesturestart to reduce pinch/double-tap zoom.
- Canvas is sized to window.innerWidth/innerHeight and uses devicePixelRatio scaling for crispness.
