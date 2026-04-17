/* =========================================================================
   Nav interactions + section reveal animations.
   ========================================================================= */

(() => {
  'use strict';

  // -------- loading screen -------------------------------------------
  const loader = document.getElementById('loader');
  if (loader) {
    window.addEventListener('load', () => {
      loader.classList.add('is-hidden');
      loader.addEventListener('transitionend', () => loader.remove());
    });
  }

  // -------- mobile nav toggle ----------------------------------------
  const nav    = document.querySelector('.nav');
  const toggle = document.querySelector('.nav__toggle');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    nav.querySelectorAll('.nav__links a').forEach(a =>
      a.addEventListener('click', () => {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      })
    );
  }

  // -------- sticky nav after hero finishes ----------------------------
  const hero = document.querySelector('.hero');
  if (nav && hero) {
    let isSticky = false;

    function checkSticky() {
      const heroEnd = hero.offsetTop + hero.offsetHeight;
      const shouldStick = window.scrollY + window.innerHeight >= heroEnd;
      if (shouldStick !== isSticky) {
        isSticky = shouldStick;
        nav.classList.toggle('nav--sticky', isSticky);
      }
    }

    window.addEventListener('scroll', checkSticky, { passive: true });
    checkSticky();
  }

  // -------- video modal -----------------------------------------------
  const modal   = document.getElementById('video-modal');
  const iframe  = document.getElementById('video-iframe');
  const playBtn = document.querySelector('.welcome__play');

  function openVideo() {
    if (!modal || !iframe || !playBtn) return;
    iframe.src = playBtn.dataset.video;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
  }
  function closeVideo() {
    if (!modal || !iframe) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    iframe.src = '';
  }

  if (playBtn) playBtn.addEventListener('click', openVideo);
  if (modal) {
    modal.querySelector('.video-modal__backdrop').addEventListener('click', closeVideo);
    modal.querySelector('.video-modal__close').addEventListener('click', closeVideo);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeVideo(); });
  }

  // -------- reveal on scroll -----------------------------------------
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const targets = document.querySelectorAll('.reveal');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('is-in'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  targets.forEach(el => io.observe(el));
})();
