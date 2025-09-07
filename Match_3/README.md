Shandar Match-3 Game
====================

Files:
- index.html : main game page
- style.css  : styles and responsive layout
- script.js  : game logic, touch controls, WebAudio pop sounds
- README.md  : this file

How to use:
1. Unzip and open index.html in a mobile browser or WebView.
2. Board auto-fits the screen; pinch-zoom disabled via viewport meta (user-scalable=no).
3. Tap a tile then tap an adjacent tile to swap. Matches of 3+ clear with satisfying pop sounds.
4. Use Shuffle/Restart to alter the board. Choose board size (6-8) for different difficulty.

Embedding into Android app:
- Copy files into `assets` and load via WebView:
  webView.loadUrl("file:///android_asset/index.html");

Notes:
- Sounds are generated with WebAudio so no external audio files are required.
- If you want packaged audio or different sound profiles (deeper pops, booms, chimes), tell me and I will add them.
