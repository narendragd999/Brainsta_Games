Shandar Fruit Slice (Fruit Ninja style)
=======================================

Files:
- index.html : main game page
- style.css  : styles and responsive layout
- script.js  : game logic, swipe detection, WebAudio sounds
- README.md  : this file

How to use:
1. Unzip and open index.html in a mobile browser or WebView.
2. Tap Start to play. Swipe across fruits to slice them. If fruits fall off bottom unsliced, you lose a life.
3. Difficulty levels: Easy / Normal / Hard. Endless mode until lives run out.
4. Sounds generated via WebAudio; no external audio files needed.

Embedding into Android app:
- Copy files into `assets` and load index.html:
  webView.loadUrl("file:///android_asset/index.html");

Notes:
- Game is responsive and fits phone screens without zoom. If you want extra polish (combo effects, fruit splashes with images, pause screen improvements), tell me and I'll add them.
