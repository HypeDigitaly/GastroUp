  // ── FAPI checkout modal: lazy-load the selected tier's order form ──
  (function(){
    var FORMS = {
      start:  { id:'4a82141f-d02b-489d-93b0-66f81a8cec6a', name:'Začátek', price:'465 Kč' },
      system: { id:'b62db8a1-103f-4b06-9fd5-5bf79ac6c84b', name:'Systém',  price:'4 650 Kč' },
      growth: { id:'6a16df2e-f715-487a-b346-b53f59255f31', name:'Růst',    price:'11 950 Kč' }
    };
    var modal    = document.getElementById('checkoutModal');
    var host     = document.getElementById('fapiHost');
    var title    = document.getElementById('coTitle');
    var fallback = document.getElementById('coFallback');
    if (!modal || !host) return;
    var loaded = {};
    var lastFocus = null;

    function showPane(tier){
      Array.prototype.forEach.call(host.children, function(c){ c.style.display = 'none'; });
      var pane = document.getElementById('fapi-' + tier);
      if (!pane){
        pane = document.createElement('div');
        pane.id = 'fapi-' + tier;
        pane.innerHTML = '<div class="fapi-loading"><span class="fapi-spinner"></span>Načítám objednávkový formulář…</div>';
        host.appendChild(pane);
      }
      pane.style.display = '';
      return pane;
    }

    function showLoadError(pane){
      var l = pane.querySelector('.fapi-loading');
      if (!l) { l = document.createElement('div'); l.className = 'fapi-loading'; pane.appendChild(l); }
      l.innerHTML = 'Formulář se nepodařilo načíst. ' +
        '<a href="' + fallback.href + '" target="_blank" rel="noopener">Otevřít objednávku v novém okně →</a>';
    }

    function loadForm(tier, pane){
      if (loaded[tier]) return;
      loaded[tier] = true;
      var settled = false;
      var timer;
      var obs = new MutationObserver(function(){
        if (pane.querySelector('.fapi-form-wrapper')){
          settled = true;
          clearTimeout(timer);
          var l = pane.querySelector('.fapi-loading');
          if (l) l.remove();
          obs.disconnect();
        }
      });
      obs.observe(pane, { childList:true, subtree:true });
      function fail(){
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        obs.disconnect();
        loaded[tier] = false; // allow a retry when the user reopens this tier
        showLoadError(pane);
      }
      // Surface the fallback link if the third-party script never renders a form
      // (network error, ad-blocker, CSP) instead of spinning forever + leaking the observer.
      timer = setTimeout(fail, 12000);
      var s = document.createElement('script');
      s.type = 'text/javascript';
      s.src  = 'https://form.fapi.cz/script.php?id=' + FORMS[tier].id;
      s.onerror = fail;
      pane.appendChild(s); // FAPI inserts the form wrapper directly after this script
    }

    // The checkout dialog is truly modal (aria-modal="true"): mark every other
    // top-level element inert so focus, pointer and the a11y tree are confined to
    // the dialog. inert is a no-op on unsupporting browsers, so this degrades safely.
    function setBackgroundInert(on){
      Array.prototype.forEach.call(document.body.children, function(el){
        if (el === modal) return;
        if (on) el.setAttribute('inert', '');
        else el.removeAttribute('inert');
      });
    }

    function open(tier){
      var f = FORMS[tier];
      if (!f) return;
      lastFocus = document.activeElement;
      title.textContent = 'Tarif ' + f.name + ' — ' + f.price + ' / měsíc';
      fallback.href = 'https://form.fapi.cz/?id=' + f.id;
      var pane = showPane(tier);
      loadForm(tier, pane);
      document.body.classList.add('gp-modal-open');
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      setBackgroundInert(true);
      var cb = document.getElementById('coClose'); // move focus into the dialog
      if (cb) { try { cb.focus(); } catch(e){} }
    }

    function close(){
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('gp-modal-open');
      setBackgroundInert(false);
      if (lastFocus && lastFocus.focus){ try { lastFocus.focus(); } catch(e){} }
    }

    document.querySelectorAll('[data-checkout]').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.preventDefault();
        open(btn.getAttribute('data-checkout'));
      });
    });
    var coClose = document.getElementById('coClose');
    if (coClose) coClose.addEventListener('click', close);
    modal.addEventListener('click', function(e){ if (e.target === modal) close(); });
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape' && modal.classList.contains('open')) close();
    });
  })();

