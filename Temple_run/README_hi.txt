
Viraaj Run — Animated (Hindi README)
-----------------------------------

Is package me:
- index.html         -> Animated Phaser 3 game. Server par host karein.
- player_sheet.png   -> chhota 4-frame player sprite-sheet (high-quality dikhne ke liye vector-like frames).
- coin_sheet.png     -> 6-frame coin animation sprite-sheet.
- obstacle.png       -> obstacle image.

Kya kiya gaya:
- Smooth animation ke liye sprite-sheets add kiye gaye hain aur run/coin animations implement kiye gaye.
- Game physics aur acceleration tune ki gayi taki Temple Run jaise smooth feel aaye.
- Size chhota rakhne ke liye assets bahut hi chhote aur compressed banaye gaye hain.
- Domain-lock implement kiya gaya: index.html me ek simple check hai jo window.location.hostname ko allowedHost ke saath compare karta hai.
  * Default allowedHost = "your-server.com" (aap ise apne server ke host name se badal dein).
  * Optional token check bhi hai (tokenUrl aur requiredToken). Agar aap chahen to apne server par /game_token.txt rakhein jisme token likh kar rakhein, aur index.html me requiredToken ko set karein.
- Mobile friendly: viewport meta + Phaser scale mode FIT + touch controls (tap to jump).

Kaise use karein:
1) Upload poori folder (saare files) apne server ke root ya kisi folder me (example: https://your-server.com/game/).
2) index.html me allowedHost ko apne domain (your-server.com) se replace karein. (Important: bina change kiye game sirf testing mode me chalega.)
3) Agar aap token check use kar rahe hain:
   - Server par ek plain text file /game_token.txt rakhein jisme aapka token same hona chahiye jo index.html me requiredToken me set kiya hai.
   - Isse extra security milegi taaki game sirf authorized server par chale.
4) Mobile par chalane ke liye browser me https://your-server.com/game/index.html open karein.
   - Agar aap Cordova/Capacitor se APK banana chahte hain to domain-lock hata dein (kyunki APK me hostname check fail kar dega) ya phir token-based server verification use karein (server se token validation).

Agar aap chahte hain ki mai zip ko password-protect kar doon to bata dein — mai wo bhi kar dunga (lekin yaad rahe password-protected zip phone par sideload karne me compatibility issues aa sakte hain).

Aage kya karna hai (main turant kar dunga):
- A) Main player animation ko aur frame-by-frame polished sprite-sheet (zyaada frames, par still optimized) bana dun? (Haan/Na)
- B) Main full Cordova/Capacitor ready project + build commands de kar signed APK ~40MB banane me madad karun? (Haan/Na)
- C) Aapka allowedHost ko maine default "your-server.com" rakha hai — main ise aapke domain se seedha set kar dun? (Aap domain bhej dein)

Jaldi batayein, mai turant aapke liye agla step bana dunga.
