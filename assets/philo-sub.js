/* Philo Agency — chování podstránek služeb (reveals, nav, FAQ). */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {

    /* ─── Scroll reveals ─── */
    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);

      gsap.utils.toArray('.reveal').forEach(function (el) {
        gsap.fromTo(el,
          { opacity: 0, y: 28 },
          {
            opacity: 1, y: 0, duration: 0.65, ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' }
          }
        );
      });

      /* Vstupní animace hero sekce */
      var heroBits = ['#sp-eyebrow', '#sp-title', '#sp-sub', '#sp-btns', '#sp-meta'].filter(function (sel) {
        return document.querySelector(sel);
      });
      if (heroBits.length) {
        gsap.set(heroBits, { opacity: 0, y: 26 });
        gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.7 } })
          .to(heroBits, { opacity: 1, y: 0, stagger: 0.09, delay: 0.05 });
      }
    } else {
      /* Pojistka: kdyby se GSAP nenačetl, obsah nesmí zůstat neviditelný. */
      document.querySelectorAll('.reveal').forEach(function (el) {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      ['#sp-eyebrow', '#sp-title', '#sp-sub', '#sp-btns', '#sp-meta'].forEach(function (sel) {
        var el = document.querySelector(sel);
        if (el) el.style.opacity = '1';
      });
    }

    /* ─── Hamburger + mobilní menu ─── */
    var hamburgerBtn = document.getElementById('hamburger-btn');
    var mobileMenu = document.getElementById('mobile-menu');
    if (hamburgerBtn && mobileMenu) {
      hamburgerBtn.addEventListener('click', function () {
        var isOpen = hamburgerBtn.classList.toggle('open');
        mobileMenu.classList.toggle('open', isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : '';
      });
      mobileMenu.querySelectorAll('a').forEach(function (el) {
        el.addEventListener('click', function () {
          hamburgerBtn.classList.remove('open');
          mobileMenu.classList.remove('open');
          document.body.style.overflow = '';
        });
      });
    }

    /* ─── Mobilní podmenu Služby ─── */
    var mobileSub = document.getElementById('mobile-sub');
    var mobileSubToggle = document.getElementById('mobile-sub-toggle');
    if (mobileSub && mobileSubToggle) {
      mobileSubToggle.addEventListener('click', function () {
        var isOpen = mobileSub.classList.toggle('open');
        mobileSubToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
    }

    /* ─── Dropdown Služby — hover řeší CSS, tady dotyk, klik mimo a Escape ─── */
    var navDrop = document.getElementById('nav-drop');
    var navDropTrigger = document.getElementById('nav-drop-trigger');
    if (navDrop && navDropTrigger) {
      var closeDrop = function () {
        navDrop.classList.remove('open');
        navDropTrigger.setAttribute('aria-expanded', 'false');
      };
      navDropTrigger.addEventListener('click', function (e) {
        e.preventDefault();
        var isOpen = navDrop.classList.toggle('open');
        navDropTrigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
      navDrop.addEventListener('mouseenter', function () { navDropTrigger.setAttribute('aria-expanded', 'true'); });
      navDrop.addEventListener('mouseleave', closeDrop);
      document.addEventListener('click', function (e) { if (!navDrop.contains(e.target)) closeDrop(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrop(); });
    }

    /* ─── FAQ akordeon ─── */
    document.querySelectorAll('.faq-trigger').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var item = btn.closest('.faq-item');
        var isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item').forEach(function (i) { i.classList.remove('open'); });
        if (!isOpen) item.classList.add('open');
      });
    });

  });
})();
