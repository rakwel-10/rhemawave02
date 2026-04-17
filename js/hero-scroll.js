/* =========================================================================
   Hero scroll-synced canvas image sequence.

   Approach: pre-extracted JPG frames are preloaded, then drawn to <canvas>
   as a ScrollTrigger progresses across a pinned 4vh section. Works
   identically forward and in reverse, unlike HTMLVideoElement.currentTime.

   Before this works you must run:   bash scripts/extract-frames.sh
   and then set FRAME_COUNT below to the number of files produced.

   If frames are missing or the user prefers-reduced-motion, the hero falls
   back gracefully to the autoplaying <video> element.
   ========================================================================= */

(() => {
  'use strict';

  // -------- config -----------------------------------------------------
  const FRAME_COUNT    = 152;                        // set from extract-frames.sh output
  const FRAME_PATH     = i => `assets/frames/frame_${String(i).padStart(4, '0')}.jpg`;
  const SCRUB_SMOOTH   = 0.5;                        // 0 = hard, higher = liquid
  const PIN_SCROLL     = '+=300%';                   // 3 viewport heights of scroll

  const canvas   = document.getElementById('hero-canvas');
  const fallback = document.getElementById('hero-fallback');
  const heroEl   = document.getElementById('hero');
  if (!canvas || !heroEl) return;

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;   // keep the <video> fallback visible

  const ctx = canvas.getContext('2d');

  // -------- sizing (DPR-aware) ----------------------------------------
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const { clientWidth: w, clientHeight: h } = canvas;
    canvas.width  = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
  }

  // -------- draw (object-fit: cover behaviour) ------------------------
  let currentIndex = -1;
  function drawFrame(i) {
    const img = images[i];
    if (!img || !img.complete || img.naturalWidth === 0) return;
    const cw = canvas.width, ch = canvas.height;
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const scale = Math.max(cw / iw, ch / ih);
    const dw = iw * scale, dh = ih * scale;
    const dx = (cw - dw) / 2, dy = (ch - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
    currentIndex = i;
  }

  // -------- preload ---------------------------------------------------
  const images = new Array(FRAME_COUNT);
  let   loadedCount = 0;
  let   firstFrameShown = false;

  function markReady() {
    canvas.classList.add('is-ready');
    if (fallback) { fallback.pause(); fallback.style.display = 'none'; }
  }

  function loadFrame(i) {
    return new Promise(resolve => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        images[i] = img;
        loadedCount++;
        if (!firstFrameShown && i === 0) {
          firstFrameShown = true;
          resize();
          drawFrame(0);
          markReady();
        }
        resolve(true);
      };
      img.onerror = () => resolve(false);
      img.src = FRAME_PATH(i + 1);
    });
  }

  // Load frame 0 first for instant display, then the rest in order.
  async function preload() {
    const firstOk = await loadFrame(0);
    if (!firstOk) {
      // Frame sequence not extracted yet — keep the <video> fallback.
      console.warn('[RhemaWave] frames missing. Run: bash scripts/extract-frames.sh');
      return false;
    }
    // Parallel batches so the browser can keep sockets busy.
    const BATCH = 6;
    for (let start = 1; start < FRAME_COUNT; start += BATCH) {
      await Promise.all(
        Array.from({ length: Math.min(BATCH, FRAME_COUNT - start) },
                   (_, k) => loadFrame(start + k))
      );
    }
    return true;
  }

  // -------- wire ScrollTrigger ---------------------------------------
  function initScroll() {
    if (!window.gsap || !window.ScrollTrigger) {
      console.warn('[RhemaWave] GSAP not loaded');
      return;
    }
    gsap.registerPlugin(ScrollTrigger);

    const state = { frame: 0 };

    gsap.to(state, {
      frame: FRAME_COUNT - 1,
      ease: 'none',
      snap: 'frame',
      scrollTrigger: {
        trigger: heroEl,
        start: 'top top',
        end: PIN_SCROLL,
        pin: '.hero__sticky',
        pinSpacing: true,
        scrub: SCRUB_SMOOTH,
        invalidateOnRefresh: true
      },
      onUpdate() {
        const i = Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(state.frame)));
        if (i !== currentIndex) drawFrame(i);
      }
    });

    // Refresh after fonts/images settle to fix pin measurements
    const refresh = () => {
      resize();
      drawFrame(currentIndex >= 0 ? currentIndex : 0);
      ScrollTrigger.refresh();
    };
    document.fonts.ready.then(refresh);
    window.addEventListener('load', refresh);

    window.addEventListener('resize', () => {
      resize();
      drawFrame(currentIndex >= 0 ? currentIndex : 0);
    });
  }

  // -------- boot ------------------------------------------------------
  resize();
  preload().then(ok => { if (ok) initScroll(); });
})();
