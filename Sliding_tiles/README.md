Shandar Puzzle Game
===================

Files:
- index.html : main game page
- style.css  : styles and themes
- script.js  : game logic (responsive, touch-friendly, image support)
- README.md  : this file

How to use:
1. Unzip and open index.html in a mobile browser or WebView.
2. Use the Size dropdown to switch between 3x3, 4x4, 5x5.
3. Choose a theme or select 'Use Image' to upload or drag & drop an image to make the puzzle from it.
4. Tap or swipe tiles adjacent to the empty space to move them.
5. Use Shuffle to randomize (ensures solvable state).

Embedding:
- Put files into your Android app assets and load index.html in a WebView:
  webView.loadUrl("file:///android_asset/index.html");

Notes:
- The game is offline and self-contained. You can style visuals further in style.css.
