/* Philo Agency — sdílený skript podstránek.
   index.html má vlastní inline skripty (hero animace, i18n); tenhle soubor
   obsahuje jen to, co potřebují statické podstránky. */
(function () {
  'use strict';

  /* ── Scroll reveal ── */
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.utils.toArray('.reveal').forEach(function (el) {
      gsap.fromTo(el, { opacity: 0, y: 26 }, {
        opacity: 1, y: 0, duration: 0.62, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 92%', toggleActions: 'play none none none' }
      });
    });
  } else {
    // GSAP nedojel (blokovaná CDN) — obsah nesmí zůstat neviditelný
    document.querySelectorAll('.reveal').forEach(function (el) {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  }

  /* ── Mobilní menu ── */
  var burger = document.getElementById('hamburger-btn');
  var menu = document.getElementById('mobile-menu');
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var isOpen = burger.classList.toggle('open');
      menu.classList.toggle('open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    menu.querySelectorAll('a, button').forEach(function (el) {
      el.addEventListener('click', function () {
        burger.classList.remove('open');
        menu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ── FAQ akordeon ── */
  document.querySelectorAll('.faq-trigger').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.faq-item');
      var isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(function (i) { i.classList.remove('open'); });
      if (!isOpen) item.classList.add('open');
    });
  });

  /* ── Plynulý scroll na kotvy v rámci stránky ── */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      var target = id && id !== '#' ? document.querySelector(id) : null;
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });

  /* ── Kontaktní formulář (jen na /kontakt) ── */
  var form = document.getElementById('contact-form');
  if (!form) return;

  var WEB3FORMS_KEY = 'acf94c7c-f4ae-4136-93d4-e800eed98043';
  var success = document.getElementById('contact-success');
  var serviceInput = document.getElementById('cf-service');

  document.querySelectorAll('#svc-chips .svc-chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      chip.classList.toggle('active');
      var picked = [];
      document.querySelectorAll('#svc-chips .svc-chip.active').forEach(function (c) {
        picked.push(c.textContent.trim());
      });
      if (serviceInput) serviceInput.value = picked.join(', ');
    });
  });

  function markError(el, bad) {
    el.style.borderColor = bad ? '#c0392b' : '';
    el.style.background = bad ? 'rgba(192,57,43,0.03)' : '';
  }

  function validate() {
    var ok = true;
    var name = document.getElementById('cf-name');
    var email = document.getElementById('cf-email');
    [name, email].forEach(function (el) {
      var bad = !el.value.trim();
      if (el === email && el.value.trim()) bad = !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim());
      markError(el, bad);
      if (bad) ok = false;
    });
    return ok;
  }

  [ 'cf-name', 'cf-email' ].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', function () { markError(el, false); });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) return;

    var btn = form.querySelector('button[type="submit"]');
    var btnText = btn.querySelector('.btn-text');
    var btnIcon = btn.querySelector('.btn-icon');
    var orig = btnText.textContent;
    btn.disabled = true;
    btn.style.opacity = '0.85';
    btnText.innerHTML = '<span class="btn-spinner"></span>';
    if (btnIcon) btnIcon.style.display = 'none';

    function reset() {
      btn.disabled = false;
      btn.style.opacity = '';
      btnText.textContent = orig;
      if (btnIcon) btnIcon.style.display = '';
    }

    var data = new FormData(form);
    data.append('access_key', WEB3FORMS_KEY);
    data.append('subject', 'Nová poptávka z PhiloAgency.com (/kontakt)');
    data.append('from_name', 'PhiloAgency.com');

    fetch('https://api.web3forms.com/submit', { method: 'POST', body: data })
      .then(function (res) { return res.json(); })
      .then(function (json) {
        if (!json.success) throw new Error(json.message || '');
        form.style.transition = 'opacity 0.3s, transform 0.3s';
        form.style.opacity = '0';
        form.style.transform = 'translateY(8px)';
        setTimeout(function () {
          form.style.display = 'none';
          success.classList.remove('hidden');
          success.style.opacity = '0';
          requestAnimationFrame(function () {
            success.style.transition = 'opacity 0.4s';
            success.style.opacity = '1';
          });
        }, 300);
      })
      .catch(function (err) {
        alert(err.message || 'Nepodařilo se odeslat formulář. Zkontrolujte připojení a zkuste to znovu.');
        reset();
      });
  });
})();
