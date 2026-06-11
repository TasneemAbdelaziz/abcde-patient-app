/* =====================================================================
   ALAMEIN MODEL HOSPITAL — Landing interactions
   Parallax · scroll reveal · count-up · nav · mobile menu · tilt · i18n
   ===================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var doc = document.documentElement;

  /* ---------------- Preloader ---------------- */
  window.addEventListener('load', function () {
    var pre = document.getElementById('preloader');
    if (pre) setTimeout(function () { pre.classList.add('done'); }, 600);
  });

  /* ---------------- Nav: scrolled state + progress bar ---------------- */
  var nav = document.getElementById('nav');
  var progress = document.getElementById('scrollProgress');

  /* ---------------- Parallax elements ---------------- */
  var parallaxEls = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));

  function onScroll() {
    var y = window.pageYOffset || doc.scrollTop;

    if (nav) nav.classList.toggle('scrolled', y > 40);

    if (progress) {
      var h = doc.scrollHeight - window.innerHeight;
      progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    }

    if (!reduceMotion) {
      var vh = window.innerHeight;
      for (var i = 0; i < parallaxEls.length; i++) {
        var el = parallaxEls[i];
        var rect = el.getBoundingClientRect();
        // distance of element centre from viewport centre
        var offset = (rect.top + rect.height / 2) - vh / 2;
        var speed = parseFloat(el.getAttribute('data-speed')) || 0.2;
        el.style.transform = 'translate3d(0,' + (-offset * speed) + 'px,0)';
      }
    }
  }

  var ticking = false;
  function requestTick() {
    if (!ticking) {
      window.requestAnimationFrame(function () { onScroll(); ticking = false; });
      ticking = true;
    }
  }
  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', requestTick, { passive: true });
  onScroll();

  /* ---------------- Scroll reveal ---------------- */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var revealObs = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { revealObs.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------------- Count-up numbers ---------------- */
  function formatNum(n, group) {
    n = Math.round(n);
    if (group) return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return n.toString();
  }

  function runCount(el) {
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    var group = el.getAttribute('data-group') === '1';
    if (reduceMotion) { el.textContent = formatNum(target, group) + suffix; return; }

    var dur = 1500, start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.textContent = formatNum(target * eased, group) + suffix;
      if (p < 1) window.requestAnimationFrame(step);
      else el.textContent = formatNum(target, group) + suffix;
    }
    window.requestAnimationFrame(step);
  }

  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window) {
    var countObs = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { runCount(e.target); obs.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { countObs.observe(el); });
  } else {
    counters.forEach(runCount);
  }

  /* ---------------- Journey timeline fill ---------------- */
  var tlFill = document.getElementById('tlFill');
  var tlSteps = document.querySelectorAll('.tl-step');
  if (tlFill && 'IntersectionObserver' in window) {
    var tlObs = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          tlFill.style.width = '100%';
          tlSteps.forEach(function (s, i) {
            setTimeout(function () { s.classList.add('in'); }, i * 130);
          });
          obs.disconnect();
        }
      });
    }, { threshold: 0.4 });
    tlObs.observe(document.querySelector('.timeline'));
  } else if (tlFill) {
    tlFill.style.width = '100%';
    tlSteps.forEach(function (s) { s.classList.add('in'); });
  }

  /* ---------------- Mobile menu ---------------- */
  var burger = document.getElementById('burger');
  var navLinks = document.getElementById('navLinks');
  function closeMenu() {
    if (burger) burger.classList.remove('open');
    if (navLinks) navLinks.classList.remove('open');
  }
  if (burger && navLinks) {
    burger.addEventListener('click', function () {
      burger.classList.toggle('open');
      navLinks.classList.toggle('open');
    });
    navLinks.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });
  }

  /* ---------------- Card tilt (desktop, pointer:fine) ---------------- */
  var finePointer = window.matchMedia('(pointer:fine)').matches;
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('.tilt').forEach(function (card) {
      card.addEventListener('mousemove', function (ev) {
        var r = card.getBoundingClientRect();
        var px = (ev.clientX - r.left) / r.width;
        var py = (ev.clientY - r.top) / r.height;
        var rx = (0.5 - py) * 8;
        var ry = (px - 0.5) * 8;
        card.style.transform = 'perspective(800px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateY(-6px)';
        card.style.setProperty('--mx', (px * 100) + '%');
        card.style.setProperty('--my', (py * 100) + '%');
      });
      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
      });
    });
  }

  /* ---------------- Language toggle (EN / AR + RTL) ---------------- */
  var langToggle = document.getElementById('langToggle');
  var i18nEls = document.querySelectorAll('[data-en]');

  function applyLang(lang) {
    var rtl = lang === 'ar';
    doc.classList.toggle('rtl', rtl);
    doc.setAttribute('lang', lang);
    doc.setAttribute('dir', rtl ? 'rtl' : 'ltr');
    i18nEls.forEach(function (el) {
      var val = el.getAttribute('data-' + lang);
      if (val !== null) {
        // preserve simple inline structures by setting innerHTML (values contain only entities, no markup)
        el.innerHTML = val;
      }
    });
    try { localStorage.setItem('amh-lang', lang); } catch (e) {}
    // recompute parallax/positions after layout shift
    requestTick();
  }

  if (langToggle) {
    langToggle.addEventListener('click', function () {
      var next = doc.classList.contains('rtl') ? 'en' : 'ar';
      applyLang(next);
    });
  }

  // restore saved language
  try {
    var saved = localStorage.getItem('amh-lang');
    if (saved === 'ar') applyLang('ar');
  } catch (e) {}

})();
