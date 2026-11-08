# 🦖 Chrome Dino Apex Bot

An ultra-lightweight, physics-tuned, background-safe automation bot for the Chrome Dino game (`chromedino.com` & `chrome://dino`). 

Unlike basic scripts that teleport the dinosaur, wipe canvas states, or fail when switching browser tabs, **Chrome Dino Apex Bot** plays organically using speed-proportional gravity, width-compensated jump arcs, strict entity classification, and an unthrottled Web Worker background relay.

---

## ✨ Key Engineering Features

* **🎯 Parabolic Apex Alignment:** Dynamically shifts the takeoff point based on current velocity and obstacle width (`th = 91 * (sp / 6) - (w * 0.15)`), placing the peak of the jump arc slightly past the center of wide 4-cactus clusters to prevent tail-clipping.
* **⚖️ Speed-Proportional Gravity:** Scales internal engine gravity (`0.6 * (sp / 8.5)`) dynamically alongside horizontal speed so the dinosaur snaps back to the ground in time for closely spaced obstacles.
* **🦅 Strict Entity Type-Checking:** Inspects internal `typeConfig.type === 'PTERODACTYL'` metadata rather than relying purely on `yPos` coordinates—fixing the classic bug where tall cacti (`yPos: 90`) trick bots into crouching.
* **🔄 Web Worker Background Relay:** Bypasses Chrome's background tab freeze (`requestAnimationFrame` halting and delta-time frame jumping) by routing ticks through an inline `Blob` Web Worker whenever `document.hidden` is active.
* **🕹️ Single-Click Toggle & Auto-Restart:** Clicking the bookmarklet once starts the bot; clicking it again cleanly terminates the worker thread and restores manual keyboard control.

---

## 🚀 Quick Setup (Bookmarklet Method — Recommended)

Because modern browsers block a single bookmark from navigating to a URL and executing JavaScript simultaneously, use this two-bookmark setup:

### Step 1: Create the Game Bookmark
1. Open **[chromedino.com](https://chromedino.com/)** in your browser.
2. Press `Ctrl + D` (or `Cmd + D` on Mac) to bookmark the page to your **Bookmarks Bar** as `🦖 Open Dino`.

### Step 2: Create the Bot Bookmarklet
1. Right-click an empty spot on your **Bookmarks Bar** and click **Add page...** (or **Add bookmark**).
2. Set the **Name** to: `⚡ Toggle Dino Bot`
3. In the **URL** field, paste the entire one-line script below and click **Save**:

```javascript
javascript:(function(){const r=typeof Runner!=='undefined'&&(Runner.instance_||(typeof Runner.getInstance==='function'&&Runner.getInstance()));if(!r){console.log('Error: Press Space once to start.');return;}if(window.dinoBotRunning){window.dinoBotRunning=false;if(window.dinoBgWorker){window.dinoBgWorker.terminate();window.dinoBgWorker=null;}console.log('Dino Bot Stopped.');return;}window.dinoBotRunning=true;console.log('Dino Bot (91 Takeoff) Started!');r.onVisibilityChange=function(){};r.onBlur=function(){};window.addEventListener('blur',e=>e.stopImmediatePropagation(),true);document.addEventListener('visibilitychange',e=>e.stopImmediatePropagation(),true);if(!window._origRAF){window._origRAF=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=function(cb){if(document.hidden&&window.dinoBotRunning){window._bgCb=cb;return 1;}return window._origRAF(cb);};}const blob=new Blob(["setInterval(()=>postMessage(0),16.67);"],{type:"application/javascript"});window.dinoBgWorker=new Worker(URL.createObjectURL(blob));window.dinoBgWorker.onmessage=function(){if(document.hidden&&window.dinoBotRunning&&window._bgCb){const cb=window._bgCb;window._bgCb=null;cb(performance.now());}};if(r.paused){r.play();}const TARGET_SPEED=10;r.setSpeed(TARGET_SPEED);function s(c,t){const e=new KeyboardEvent(t,{keyCode:c,which:c,bubbles:true});document.dispatchEvent(e);}function l(){if(!window.dinoBotRunning)return;if(r.crashed){s(32,'keydown');setTimeout(()=>s(32,'keyup'),100);requestAnimationFrame(l);return;}if(r.currentSpeed<TARGET_SPEED){r.setSpeed(TARGET_SPEED);}const dynGravity="0.6*(sp/8.5);r.config.GRAVITY=dynGravity;if(r.tRex){r.tRex.config.GRAVITY=dynGravity;}const" o="r.horizon&&r.horizon.obstacles;if(o&&o.length" sp="r.currentSpeed||TARGET_SPEED;const">0){const ob=o[0],t=r.tRex;const w=ob.width||25;const th=(91*(sp/6))-(w*0.15);if(ob.xPos<th&&ob.xPos>0){const isBird=ob.typeConfig&&ob.typeConfig.type==='PTERODACTYL';if(isBird){if(ob.yPos<=80){if(t&&!t.jumping&&!t.ducking){t.setDuck(true);setTimeout(()=>{if(t)t.setDuck(false);},300);}}else{if(t&&!t.jumping&&!t.ducking){s(38,'keydown');setTimeout(()=>s(38,'keyup'),100);}}}else{if(t&&!t.jumping&&!t.ducking){s(38,'keydown');setTimeout(()=>s(38,'keyup'),100);}}}}window._origRAF(l);}window._origRAF(l);})();
```

---

## 🎮 How to Run, Stop & Restart

### ▶️ How to Start the Bot
1. Open the game and press the **Spacebar** once so the dinosaur starts running.
2. Click your **`⚡ Toggle Dino Bot`** bookmarklet on the Bookmarks Bar.
3. The game immediately locks onto a base speed of `10` and begins clearing obstacles automatically—even if you switch to another browser tab.

### ⏹️ How to Stop / End the Bot Mid-Run
* Click the **`⚡ Toggle Dino Bot`** bookmarklet **a second time**.
* This sets `window.dinoBotRunning = false`, terminates the background Web Worker (`window.dinoBgWorker.terminate()`), and hands manual control back to your keyboard without crashing or refreshing your current run.

### 🔄 How to Restart
* **Automatic Crash Recovery:** If the dinosaur ever clips an obstacle at extreme speeds, the bot automatically dispatches a synthetic `Spacebar` press (`keyCode: 32`) after 100ms to restart the run organically.
* **Manual Reset:** Click the bookmarklet once to stop the bot, press `F5` to reload the page, press `Spacebar` to start a fresh run, and click the bookmarklet again.

### 💻 Alternative: DevTools Console Method
If you are playing on offline `chrome://dino` (where Chrome disables bookmarklets by default):
1. Press `Ctrl + Shift + I` (or `F12`) to open Chrome DevTools and select the **Console** tab.
2. Press **Spacebar** in the game window once.
3. Paste the contents of [`src/dino-bot.js`](src/dino-bot.js) into the console and press **Enter**.
4. Run the same snippet again anytime to toggle the bot off.

---

## 🧠 Under the Hood (For Nerds & Modders)

### 1. Obstacle Classification Matrix
The Chrome Dino engine spawns three primary obstacle categories inside `Runner.instance_.horizon.obstacles`. Relying purely on `yPos` causes false positives because `CACTUS_LARGE` shares vertical coordinates with mid-air birds:

| Obstacle Type | `typeConfig.type` | Engine `yPos` | Bot Action |
| :--- | :--- | :--- | :--- |
| Small Cactus | `CACTUS_SMALL` | `105` | **Jump** (`keyCode: 38`) |
| Large Cactus / Cluster | `CACTUS_LARGE` | `90` | **Jump** (`keyCode: 38`) |
| Low Pterodactyl | `PTERODACTYL` | `100` | **Jump** (`keyCode: 38`) |
| Mid Pterodactyl (Mouth) | `PTERODACTYL` | `75` | **Crouch** (`tRex.setDuck(true)`) |
| High Pterodactyl | `PTERODACTYL` | `50` | **Crouch** (`tRex.setDuck(true)`) |

### 2. Tuning the Parabolic Jump Arc
The horizontal takeoff threshold `th` is calculated every frame using:
```javascript
const th = (91 * (sp / 6)) - (w * 0.15);
```
* **Base Takeoff (`91`):** Controls how early the dinosaur jumps relative to speed (`sp`). Increasing `91` shifts the jump apex **forward** (toward the front of the obstacle); decreasing it shifts the apex **backward**.
* **Width Compensation (`- (w * 0.15)`):** A single small cactus is `17px` wide, while a 4-cactus cluster is up to `100px` wide. Subtracting `15%` of the obstacle's width delays takeoff slightly on wide groups so the dinosaur's tail clears the back edge on descent.

### 3. Why Background Tabs Normally Crash (And How We Fix It)
When you switch tabs, Chromium browsers halt `window.requestAnimationFrame` to save CPU. Meanwhile, the Dino engine tracks elapsed time between frames. If you return to the tab 10 seconds later, the engine multiplies obstacle velocity by `10,000ms` in a single frame—teleporting obstacles straight into the dinosaur.

By intercepting `window.requestAnimationFrame` when `document.hidden === true` and driving the queued callback via a dedicated **Web Worker** ticking every `16.67ms`, the game loop continues stepping at a steady 60 FPS in the background with zero frame-delta accumulation.

---

## ⚙️ Customizing Parameters

Want to tweak the bot for different tournament rules? Edit these constants in `src/dino-bot.js`:

* **Change Base Speed:** Modify `const TARGET_SPEED = 10;` (values between `8` and `14` are stable).
* **Shift Jump Apex:** Modify `91` in `const th = (91 * (sp / 6)) - (w * 0.15);`.
* **Adjust Fall Snap:** Modify `8.5` in `const dynGravity = 0.6 * (sp / 8.5);` (lower denominator = heavier gravity).

---

## 📜 License
Released under the [MIT License](LICENSE). Built for educational experimentation and browser game physics research.
