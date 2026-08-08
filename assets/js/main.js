/* =============================================================================
   Dent Ninja — interaction layer
   Pointer-driven 3D tilt, scroll reveals, magnetic buttons, adaptive hero
   video, and WhatsApp deep-link composition. No dependencies.
   ============================================================================= */
(function () {
  'use strict';

  /* ---------- config ---------- */
  var PHONE_INTL = '27656401620';           // +27 65 640 1620
  var MOBILE_Q   = '(max-width: 860px)';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse  = window.matchMedia('(hover: none)').matches;

  var raf = window.requestAnimationFrame.bind(window);
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* =========================================================================
     WhatsApp deep links
     ========================================================================= */
  function waHref(msg) {
    return 'https://wa.me/' + PHONE_INTL + (msg ? '?text=' + encodeURIComponent(msg) : '');
  }

  document.querySelectorAll('[data-wa]').forEach(function (el) {
    el.setAttribute('href', waHref(el.getAttribute('data-wa-msg') || ''));
    el.setAttribute('target', '_blank');
    el.setAttribute('rel', 'noopener noreferrer');
  });

  /* =========================================================================
     Header — stuck state + mobile menu + scroll-spy
     ========================================================================= */
  var hdr = document.getElementById('hdr');
  var nav = document.getElementById('nav');
  var burger = document.getElementById('burger');

  var lastStuck = null;
  function onScrollHeader() {
    var stuck = window.scrollY > 24;
    if (stuck !== lastStuck) {
      hdr.classList.toggle('is-stuck', stuck);
      lastStuck = stuck;
    }
  }
  onScrollHeader();

  function closeMenu() {
    nav.classList.remove('is-open');
    hdr.classList.remove('is-menu');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
  }

  burger.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    hdr.classList.toggle('is-menu', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });

  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) closeMenu();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      closeMenu();
      burger.focus();
    }
  });

  // close the mobile menu if the viewport grows past the breakpoint
  var wideQ = window.matchMedia('(min-width: 901px)');
  (wideQ.addEventListener ? wideQ.addEventListener.bind(wideQ, 'change') : wideQ.addListener.bind(wideQ))(function (e) {
    if (e.matches) closeMenu();
  });

  /* scroll-spy */
  var navLinks = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
  var sections = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* =========================================================================
     Scroll reveals

     Deliberately rect-based rather than IntersectionObserver-only: IO
     callbacks are throttled in background/non-compositing tabs, and anything
     gated behind them would stay at opacity:0. Content must never depend on
     an observer firing. Cheap enough at this element count to not care.
     ========================================================================= */
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

  if (reduced) {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    // stagger siblings so groups cascade instead of popping together
    var groups = new Map();
    reveals.forEach(function (el) {
      var p = el.parentElement;
      if (!groups.has(p)) groups.set(p, 0);
      var i = groups.get(p);
      el.style.setProperty('--d', Math.min(i, 6) * 85 + 'ms');
      groups.set(p, i + 1);
    });

    var pending = reveals.slice();
    var sweepQueued = false;

    var sweep = function () {
      sweepQueued = false;
      var vh = window.innerHeight || document.documentElement.clientHeight;
      for (var i = pending.length - 1; i >= 0; i--) {
        var r = pending[i].getBoundingClientRect();
        // visible, or already scrolled past
        if (r.top < vh * 0.9 && r.bottom > 0) {
          pending[i].classList.add('is-in');
          pending.splice(i, 1);
        }
      }
      if (!pending.length) {
        window.removeEventListener('scroll', queueSweep);
        window.removeEventListener('resize', queueSweep);
      }
    };

    var queueSweep = function () {
      if (sweepQueued) return;
      sweepQueued = true;
      raf(sweep);
    };

    window.addEventListener('scroll', queueSweep, { passive: true });
    window.addEventListener('resize', queueSweep, { passive: true });
    window.addEventListener('load', queueSweep);
    sweep();
  }

  /* =========================================================================
     3D tilt — pointer-driven, spring-smoothed, preserve-3d
     ========================================================================= */
  function initTilt() {
    if (reduced || coarse) return;

    document.querySelectorAll('[data-tilt]').forEach(function (el) {
      var max = parseFloat(el.getAttribute('data-tilt-max')) || 11;
      var tx = 0, ty = 0, cx = 0, cy = 0, gl = 0, cgl = 0;
      var running = false, hovering = false;

      var target = el.querySelector('.card__in, .creds__inner') || el;
      el.style.perspective = '1200px';

      function frame() {
        cx = lerp(cx, tx, 0.11);
        cy = lerp(cy, ty, 0.11);
        cgl = lerp(cgl, gl, 0.11);

        target.style.transform =
          'perspective(1200px) rotateX(' + cy.toFixed(3) + 'deg) rotateY(' + cx.toFixed(3) +
          'deg) translateZ(' + (cgl * 10).toFixed(2) + 'px) scale(' + (1 + cgl * 0.014).toFixed(4) + ')';

        if (Math.abs(cx - tx) > 0.02 || Math.abs(cy - ty) > 0.02 || Math.abs(cgl - gl) > 0.004) {
          raf(frame);
        } else {
          running = false;
          if (!hovering) target.style.transform = '';
        }
      }
      function kick() { if (!running) { running = true; raf(frame); } }

      el.addEventListener('pointermove', function (e) {
        if (e.pointerType === 'touch') return;
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        tx = (px - 0.5) * 2 * max;
        ty = -(py - 0.5) * 2 * max;
        gl = 1;
        hovering = true;
        el.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
        var inner = el.querySelector('.card__in');
        if (inner) {
          inner.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
          inner.style.setProperty('--my', (py * 100).toFixed(1) + '%');
        }
        kick();
      });

      el.addEventListener('pointerleave', function () {
        tx = 0; ty = 0; gl = 0; hovering = false; kick();
      });
    });
  }

  /* =========================================================================
     Hero parallax — layered depth on pointer + scroll
     ========================================================================= */
  function initHeroParallax() {
    var scene = document.querySelector('[data-parallax-scene]');
    if (!scene || reduced) return;

    var layers = Array.prototype.slice.call(scene.querySelectorAll('[data-depth]'));
    var video = document.getElementById('heroVideo');
    var pointerX = 0, pointerY = 0, curX = 0, curY = 0;
    var scrollY = 0, running = false;

    function frame() {
      curX = lerp(curX, pointerX, 0.07);
      curY = lerp(curY, pointerY, 0.07);

      layers.forEach(function (l) {
        var d = parseFloat(l.getAttribute('data-depth')) || 10;
        var k = d / 100;
        l.style.setProperty(
          'transform',
          'translate3d(' + (curX * k * 26).toFixed(2) + 'px,' +
          (curY * k * 18 - scrollY * k * 0.28).toFixed(2) + 'px,0)'
        );
      });

      if (video && !coarse) {
        video.style.transform = 'scale(1.06) translate3d(' +
          (curX * -9).toFixed(2) + 'px,' + (curY * -6 + scrollY * 0.06).toFixed(2) + 'px,0)';
      }

      if (Math.abs(curX - pointerX) > 0.001 || Math.abs(curY - pointerY) > 0.001) raf(frame);
      else running = false;
    }
    function kick() { if (!running) { running = true; raf(frame); } }

    if (!coarse) {
      window.addEventListener('pointermove', function (e) {
        if (e.pointerType === 'touch') return;
        pointerX = (e.clientX / window.innerWidth - 0.5) * 2;
        pointerY = (e.clientY / window.innerHeight - 0.5) * 2;
        kick();
      }, { passive: true });
    }

    window.addEventListener('scroll', function () {
      scrollY = window.scrollY;
      if (scrollY < window.innerHeight * 1.2) kick();
    }, { passive: true });
  }

  /* =========================================================================
     Magnetic buttons
     ========================================================================= */
  function initMagnetic() {
    if (reduced || coarse) return;

    document.querySelectorAll('[data-magnetic]').forEach(function (el) {
      var tx = 0, ty = 0, cx = 0, cy = 0, running = false;

      function frame() {
        cx = lerp(cx, tx, 0.16);
        cy = lerp(cy, ty, 0.16);
        el.style.transform = 'translate3d(' + cx.toFixed(2) + 'px,' + cy.toFixed(2) + 'px,0)';
        if (Math.abs(cx - tx) > 0.05 || Math.abs(cy - ty) > 0.05) raf(frame);
        else { running = false; if (!tx && !ty) el.style.transform = ''; }
      }
      function kick() { if (!running) { running = true; raf(frame); } }

      el.addEventListener('pointermove', function (e) {
        if (e.pointerType === 'touch') return;
        var r = el.getBoundingClientRect();
        tx = clamp((e.clientX - (r.left + r.width / 2)) * 0.22, -14, 14);
        ty = clamp((e.clientY - (r.top + r.height / 2)) * 0.3, -10, 10);
        kick();
      });
      el.addEventListener('pointerleave', function () { tx = 0; ty = 0; kick(); });
    });
  }

  /* =========================================================================
     Process step number — 3D flip on reveal
     ========================================================================= */
  function initFlips() {
    if (reduced || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        io.unobserve(el);
        var delay = 220 + Array.prototype.indexOf.call(el.closest('ol').children, el.closest('li')) * 130;
        setTimeout(function () {
          el.classList.add('is-flipped');
          setTimeout(function () { el.classList.remove('is-flipped'); }, 1500);
        }, delay);
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('[data-flip]').forEach(function (el) { io.observe(el); });
  }

  /* =========================================================================
     Hero video — pick the right cut, respect data-saver & reduced motion
     ========================================================================= */
  function initHeroVideo() {
    var v = document.getElementById('heroVideo');
    if (!v) return;

    var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    var saveData = !!(conn && (conn.saveData || /2g/.test(conn.effectiveType || '')));

    if (reduced || saveData) {
      v.removeAttribute('autoplay');
      v.poster = window.matchMedia(MOBILE_Q).matches
        ? v.dataset.posterMobile : v.dataset.posterDesktop;
      return;
    }

    var current = null;
    function pick() {
      var mobile = window.matchMedia(MOBILE_Q).matches;
      var src = mobile ? v.dataset.mobile : v.dataset.desktop;
      if (src === current) return;
      current = src;
      v.poster = mobile ? v.dataset.posterMobile : v.dataset.posterDesktop;
      v.setAttribute('preload', 'auto');
      v.src = src;
      v.load();
      var p = v.play();
      if (p && p.catch) p.catch(function () { /* autoplay blocked — poster remains */ });
    }

    pick();

    var mq = window.matchMedia(MOBILE_Q);
    (mq.addEventListener ? mq.addEventListener.bind(mq, 'change') : mq.addListener.bind(mq))(pick);

    // pause when off-screen — saves battery on phones
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
          else v.pause();
        });
      }, { threshold: 0.01 }).observe(v);
    }
  }

  /* =========================================================================
     Quote form -> WhatsApp
     ========================================================================= */
  function initForm() {
    var form = document.getElementById('qform');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var bad = null;
      form.querySelectorAll('[required]').forEach(function (input) {
        var field = input.closest('.field');
        var ok = input.value.trim().length > 0;
        field.classList.toggle('is-bad', !ok);
        if (!ok && !bad) bad = input;
      });
      if (bad) { bad.focus(); return; }

      var val = function (id) { return (document.getElementById(id).value || '').trim(); };
      var lines = [
        'Hi Dent Ninja 👋',
        '',
        'I’d like a quote for paintless dent removal.',
        '',
        'Name: ' + val('qname'),
        'Vehicle: ' + val('qcar'),
        'Area: ' + val('qarea'),
        'Damage: ' + val('qtype')
      ];
      var extra = val('qmsg');
      if (extra) lines.push('Notes: ' + extra);
      lines.push('', '(Photos attached below 📷)');

      window.open(waHref(lines.join('\n')), '_blank', 'noopener');
    });

    form.addEventListener('input', function (e) {
      var f = e.target.closest('.field');
      if (f) f.classList.remove('is-bad');
    });
  }

  /* =========================================================================
     WhatsApp FAB — tease the label once, then settle
     ========================================================================= */
  function initFab() {
    var fab = document.querySelector('.wa');
    if (!fab) return;

    // While the hero's own WhatsApp CTA is on screen the FAB is redundant —
    // and on short phones it sits right on top of the Call button. Stand down
    // until the user has scrolled past it. Defaults to visible if IO is absent.
    var heroCta = document.querySelector('.hero__actions');
    if (heroCta && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { fab.classList.toggle('is-hidden', en.isIntersecting); });
      }, { threshold: 0.35 }).observe(heroCta);
    }

    if (reduced) return;
    setTimeout(function () {
      if (fab.classList.contains('is-hidden')) return;
      fab.classList.add('is-teased');
      setTimeout(function () { fab.classList.remove('is-teased'); }, 3600);
    }, 2600);
  }

  /* =========================================================================
     Misc
     ========================================================================= */
  function initMisc() {
    var yr = document.getElementById('yr');
    if (yr) yr.textContent = new Date().getFullYear();

    // ticker: duplicate content is authored in markup; pause when off-screen
    var ticker = document.querySelector('.ticker__track');
    if (ticker && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          ticker.style.animationPlayState = en.isIntersecting ? 'running' : 'paused';
        });
      }, { threshold: 0 }).observe(ticker);
    }
  }

  /* ---------- boot ---------- */
  window.addEventListener('scroll', onScrollHeader, { passive: true });

  initHeroVideo();
  initMisc();
  initForm();
  initTilt();
  initHeroParallax();
  initMagnetic();
  initFlips();
  initFab();
})();
