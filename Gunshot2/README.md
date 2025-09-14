
Pulse Strike — Action Canvas Game (Demo)
========================================

What's included
- index.html : single-page game entry
- game.js : game engine, input, visuals (no external libraries)
- styles.css : UI + HUD + overlay
- README.md : this file
- action_game.zip : (this zip file) - if you click Download inside the game, it will download the zip

How to run
1. Unzip the package to a folder.
2. Open index.html in a modern browser (Chrome, Edge, Firefox, Safari).
3. Controls: WASD / Arrow keys to move. Mouse to aim. Left-click or touch right half to shoot. Press Enter to start.

Notes & improvements
- The game is a compact, high-visual demo using procedural effects and SVG sprites. To raise visuals further, replace the SVG sprites with high-res PNGs or sprite sheets (place them in the folder and update the paths in game.js).
- Add sound effects: place small .ogg/.mp3 files in the folder and use the WebAudio API or HTMLAudioElement to play them on events (shoot/explosion/hit).
- To make a distributable mobile app, wrap this in Cordova / Capacitor or export as a PWA with a manifest.
- If you want a Unity/Unreal-level AAA game, I can give a blueprint and asset list (but those require heavy tooling and are outside a single zip).

Licensing
- You may reuse and modify these files freely. Attribution appreciated but not required.
