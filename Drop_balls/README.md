Funny Falling Puzzle - Endless
==============================

Files:
- index.html : main game page
- style.css  : styles and responsive layout
- script.js  : game logic (drag & drop, endless spawning, sounds)
- README.md  : this file

How to use:
1. Unzip and open index.html in a mobile browser or WebView.
2. Tap Start to begin. Items will spawn endlessly; drag them into the matching bucket.
3. Use Pause to stop. Restart clears items and restarts the game.
4. Speed slider controls spawn frequency (lower ms = faster spawning).

Embedding into Android app:
- Copy files into `assets` and load via WebView:
  webView.loadUrl("file:///android_asset/index.html");

Notes:
- Sounds are generated with WebAudio so no external audio files are required.
- The game is responsive and fits phone screens without zoom.
