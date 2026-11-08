/**
 * Chrome Dino Apex Bot
 * Features: Speed-Proportional Gravity, Width-Compensated Parabolic Jump Arcs,
 * Strict Type-Checking (Pterodactyl vs. Large Cactus), and Web Worker Background Relay.
 */
(function () {
  const r =
    typeof Runner !== 'undefined' &&
    (Runner.instance_ ||
      (typeof Runner.getInstance === 'function' && Runner.getInstance()));

  if (!r) {
    console.warn('[DinoBot] Error: Start the game by pressing Space once before activating.');
    return;
  }

  // Toggle OFF if already running
  if (window.dinoBotRunning) {
    window.dinoBotRunning = false;
    if (window.dinoBgWorker) {
      window.dinoBgWorker.terminate();
      window.dinoBgWorker = null;
    }
    console.log('[DinoBot] Bot Stopped. Manual control restored.');
    return;
  }

  // Toggle ON
  window.dinoBotRunning = true;
  console.log('[DinoBot] Bot Activated (Base Takeoff: 91 | Target Speed: 10)');

  // 1. Neutralize Focus & Visibility Pause Listeners
  r.onVisibilityChange = function () {};
  r.onBlur = function () {};
  window.addEventListener('blur', (e) => e.stopImmediatePropagation(), true);
  document.addEventListener('visibilitychange', (e) => e.stopImmediatePropagation(), true);

  // 2. Hijack requestAnimationFrame for Background Tab Persistence
  if (!window._origRAF) {
    window._origRAF = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = function (cb) {
      if (document.hidden && window.dinoBotRunning) {
        window._bgCb = cb;
        return 1;
      }
      return window._origRAF(cb);
    };
  }

  // 3. Spawn Unthrottled Web Worker Heartbeat (60 FPS / 16.67ms)
  const blob = new Blob(['setInterval(()=>postMessage(0),16.67);'], {
    type: 'application/javascript',
  });
  window.dinoBgWorker = new Worker(URL.createObjectURL(blob));
  window.dinoBgWorker.onmessage = function () {
    if (document.hidden && window.dinoBotRunning && window._bgCb) {
      const cb = window._bgCb;
      window._bgCb = null;
      cb(performance.now());
    }
  };

  if (r.paused) {
    r.play();
  }

  const TARGET_SPEED = 10;
  r.setSpeed(TARGET_SPEED);

  // Synthetic keyboard dispatcher for organic inputs & restarts
  function dispatchKey(keyCode, type) {
    const e = new KeyboardEvent(type, {
      keyCode: keyCode,
      which: keyCode,
      bubbles: true,
    });
    document.dispatchEvent(e);
  }

  // 4. Core Bot Physics & Decision Loop
  function loop() {
    if (!window.dinoBotRunning) return;

    // Organic crash recovery via Spacebar tap
    if (r.crashed) {
      dispatchKey(32, 'keydown');
      setTimeout(() => dispatchKey(32, 'keyup'), 100);
      requestAnimationFrame(loop);
      return;
    }

    // Maintain minimum speed floor
    if (r.currentSpeed < TARGET_SPEED) {
      r.setSpeed(TARGET_SPEED);
    }

    const sp = r.currentSpeed || TARGET_SPEED;

    // Speed-proportional dynamic gravity scaling
    const dynGravity = 0.6 * (sp / 8.5);
    r.config.GRAVITY = dynGravity;
    if (r.tRex) {
      r.tRex.config.GRAVITY = dynGravity;
    }

    // Obstacle scanning & classification
    const obstacles = r.horizon && r.horizon.obstacles;
    if (obstacles && obstacles.length > 0) {
      const ob = obstacles[0];
      const t = r.tRex;
      const w = ob.width || 25;

      // Width-compensated takeoff threshold (Base: 91)
      const th = 91 * (sp / 6) - w * 0.15;

      if (ob.xPos < th && ob.xPos > 0) {
        const isBird = ob.typeConfig && ob.typeConfig.type === 'PTERODACTYL';

        if (isBird) {
          // Mouth-height or high bird -> Crouch
          if (ob.yPos <= 80) {
            if (t && !t.jumping && !t.ducking) {
              t.setDuck(true);
              setTimeout(() => {
                if (t) t.setDuck(false);
              }, 300);
            }
          } else {
            // Low bird -> Jump
            if (t && !t.jumping && !t.ducking) {
              dispatchKey(38, 'keydown');
              setTimeout(() => dispatchKey(38, 'keyup'), 100);
            }
          }
        } else {
          // Ground Cactus (Small, Large, or 4-Cluster) -> Jump
          if (t && !t.jumping && !t.ducking) {
            dispatchKey(38, 'keydown');
            setTimeout(() => dispatchKey(38, 'keyup'), 100);
          }
        }
      }
    }

    window._origRAF(loop);
  }

  window._origRAF(loop);
})();
