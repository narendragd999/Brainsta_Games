Touch Snake Game
================

Files:
- index.html : main game page
- style.css  : styles
- script.js  : game logic (touch, swipe, controls)
- README.md  : this file

How to use:
1. Unzip the archive and open index.html in a mobile browser or WebView (Android WebView).
2. The game is responsive and supports touch swipe and on-screen buttons.
3. Use the Speed slider to change game speed.
4. The game supports wrap-around and will end when the snake hits itself.

Embedding into an Android app:
- Copy the files into your app's `assets` folder and load index.html into a WebView:
  `webView.loadUrl("file:///android_asset/index.html");`

Notes:
- The game is plain HTML/JS and runs offline in the browser. Feel free to modify visuals or grid size in script.js.
