  // Lead popup — 50% scroll trigger, localStorage suppression
  (function(){
    var POPUP_SEEN_KEY = 'gp_popup_seen';
    var LEAD_KEY = 'gp_lead_submitted';
    var TTL_DAYS = 7;
    var popup = document.getElementById('leadPopup');
    if (!popup) return;

    function isSuppressed(){
      try {
        if (localStorage.getItem(LEAD_KEY) === '1') return true;
        var seen = parseInt(localStorage.getItem(POPUP_SEEN_KEY), 10);
        if (isNaN(seen)) return false; // missing or corrupted timestamp → treat as not seen
        var diff = (Date.now() - seen) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff < TTL_DAYS;
      } catch (e) { return false; }
    }

    function show(){
      popup.hidden = false;
      requestAnimationFrame(function(){
        requestAnimationFrame(function(){
          popup.setAttribute('aria-hidden', 'false');
          var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          if (!prefersReduced) {
            var firstInput = popup.querySelector('input');
            if (firstInput) { try { firstInput.focus({ preventScroll: true }); } catch(e) { firstInput.focus(); } }
          }
        });
      });
    }

    function hide(){
      popup.setAttribute('aria-hidden', 'true');
      setTimeout(function(){ popup.hidden = true; }, 350);
    }

    function dismiss(){
      try { localStorage.setItem(POPUP_SEEN_KEY, String(Date.now())); } catch(e){}
      var lf = document.getElementById('leadForm');
      if (lf) lf._aborted = true;
      hide();
    }

    function onScroll(){
      if (isSuppressed()) { window.removeEventListener('scroll', onScroll); return; }
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      var pct = window.scrollY / docHeight;
      if (pct >= 0.5) {
        show();
        window.removeEventListener('scroll', onScroll);
        window.addEventListener('scroll', onBottomScroll, { passive: true });
      }
    }

    function onBottomScroll(){
      if (popup.hidden) { window.removeEventListener('scroll', onBottomScroll); return; }
      var nearBottom = (window.scrollY + window.innerHeight) >= (document.documentElement.scrollHeight - 80);
      if (nearBottom) {
        hide();
        window.removeEventListener('scroll', onBottomScroll);
      }
    }

    if (!isSuppressed()) {
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    var closeBtn = document.getElementById('lpClose');
    if (closeBtn) closeBtn.addEventListener('click', dismiss);

    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape' && !popup.hidden) dismiss();
    });

    var form = document.getElementById('leadForm');
    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        var btn = form.querySelector('[type=submit]');
        var errEl = document.getElementById('leadError');
        form._aborted = false;
        if (form.elements['company_website'] && form.elements['company_website'].value) {
          try { localStorage.setItem(LEAD_KEY, '1'); } catch(_){}
          form.hidden = true;
          var fff = document.querySelector('.lp-foot');
          if (fff) fff.hidden = true;
          var succH = document.getElementById('lpSuccess');
          if (succH) succH.hidden = false;
          setTimeout(hide, 2800);
          return;
        }
        var origText = btn ? btn.innerHTML : '';
        if (btn) { btn.disabled = true; btn.innerHTML = 'Odesílám...'; }
        if (errEl) { errEl.hidden = true; errEl.textContent = ''; }
        var data = {
          email: form.elements['email'] ? form.elements['email'].value : '',
          phone: form.elements['phone'] ? form.elements['phone'].value : ''
        };
        submitForm('/.netlify/functions/ebook', data).then(function() {
          if (form._aborted) return;
          try { localStorage.setItem(LEAD_KEY, '1'); } catch(_){}
          form.hidden = true;
          var ff = document.querySelector('.lp-foot');
          if (ff) ff.hidden = true;
          var succ = document.getElementById('lpSuccess');
          if (succ) succ.hidden = false;
          setTimeout(hide, 2800);
        }).catch(function(err) {
          if (form._aborted) return;
          if (btn) { btn.disabled = false; btn.innerHTML = origText; }
          if (errEl) {
            errEl.textContent = err.message || 'Nepodařilo se odeslat. Zkus to prosím znovu.';
            errEl.hidden = false;
          }
        });
      });
    }
  })();

  // ── Static ebook lead-magnet form (mirrors the popup; suppresses popup once submitted) ──
  (function(){
    var form = document.getElementById('ebookForm');
    if (!form) return;
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var btn = form.querySelector('[type=submit]');
      var errEl = document.getElementById('ebookError');
      if (form.elements['company_website'] && form.elements['company_website'].value) {
        try { localStorage.setItem('gp_lead_submitted', '1'); } catch(_){}
        form.classList.add('sent');
        var succH = document.getElementById('ebookSuccess');
        if (succH) succH.classList.add('show');
        return;
      }
      var origText = btn ? btn.innerHTML : '';
      if (btn) { btn.disabled = true; btn.innerHTML = 'Odesílám...'; }
      if (errEl) { errEl.hidden = true; errEl.textContent = ''; }
      var data = {
        email: form.elements['email'] ? form.elements['email'].value : '',
        phone: form.elements['phone'] ? form.elements['phone'].value : ''
      };
      submitForm('/.netlify/functions/ebook', data).then(function() {
        try { localStorage.setItem('gp_lead_submitted', '1'); } catch(_){}
        form.classList.add('sent');
        var succ = document.getElementById('ebookSuccess');
        if (succ) succ.classList.add('show');
        var lp = document.getElementById('leadPopup');
        if (lp && !lp.hidden) {
          lp.setAttribute('aria-hidden', 'true');
          setTimeout(function(){ lp.hidden = true; }, 350);
        }
      }).catch(function(err) {
        if (btn) { btn.disabled = false; btn.innerHTML = origText; }
        if (errEl) {
          errEl.textContent = err.message || 'Nepodařilo se odeslat. Zkus to prosím znovu.';
          errEl.hidden = false;
        }
      });
    });
  })();

  // ── Poptávkový (kontaktní) formulář — třetí cesta ──
  // POZN: zatím front-end atrapa (preventDefault). Backend (FAPI lead / Formspree / Web3Forms)
  // napojíš na místě označeném TODO níže — stačí poslat new FormData(form) na endpoint.
  (function(){
    var form = document.getElementById('contactForm');
    if (!form) return;

    // Chips pro preferovaný způsob kontaktu (jedno-výběr, zrcadlí se do skrytého inputu)
    var chips = form.querySelectorAll('.contact-chip');
    var prefInput = document.getElementById('cPref');
    chips.forEach(function(chip){
      chip.addEventListener('click', function(){
        chips.forEach(function(c){ c.setAttribute('aria-pressed', 'false'); });
        chip.setAttribute('aria-pressed', 'true');
        if (prefInput) prefInput.value = chip.getAttribute('data-pref');
      });
    });

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var btn = form.querySelector('[type=submit]');
      var errEl = document.getElementById('contactError');
      if (form.elements['company_website'] && form.elements['company_website'].value) {
        var cardH = form.closest('.contact-card');
        var descH = cardH ? cardH.querySelector('.desc') : null;
        if (descH) descH.hidden = true;
        form.hidden = true;
        var succH = document.getElementById('contactSuccess');
        if (succH) { succH.classList.add('show'); requestAnimationFrame(function(){ requestAnimationFrame(function(){ succH.classList.add('visible'); }); }); }
        return;
      }
      var origText = btn ? btn.innerHTML : '';
      if (btn) { btn.disabled = true; btn.innerHTML = 'Odesílám...'; }
      if (errEl) { errEl.hidden = true; errEl.textContent = ''; }
      var data = {
        name: form.elements['name'] ? form.elements['name'].value : '',
        phone: form.elements['phone'] ? form.elements['phone'].value : '',
        email: form.elements['email'] ? form.elements['email'].value : '',
        message: form.elements['message'] ? form.elements['message'].value : '',
        preference: form.elements['preference'] ? form.elements['preference'].value : 'Telefon'
      };
      submitForm('/.netlify/functions/contact', data).then(function() {
        var card = form.closest('.contact-card');
        var desc = card ? card.querySelector('.desc') : null;
        if (desc) desc.hidden = true;
        form.hidden = true;
        var succ = document.getElementById('contactSuccess');
        if (succ) { succ.classList.add('show'); requestAnimationFrame(function(){ requestAnimationFrame(function(){ succ.classList.add('visible'); }); }); }
      }).catch(function(err) {
        if (btn) { btn.disabled = false; btn.innerHTML = origText; }
        if (errEl) {
          errEl.textContent = err.message || 'Nepodařilo se odeslat. Zkus to prosím znovu.';
          errEl.hidden = false;
        }
      });
    });

    // Skok z demo bandu / patičky do formuláře + zaostření prvního pole
    document.querySelectorAll('[data-contact-jump]').forEach(function(link){
      link.addEventListener('click', function(){
        var first = document.getElementById('cName');
        if (!first) return;
        setTimeout(function(){
          try { first.focus({ preventScroll: true }); } catch(err){ first.focus(); }
        }, 520);
      });
    });
  })();

