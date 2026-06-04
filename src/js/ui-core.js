  // Nav scroll state
  const nav = document.getElementById('nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, {passive:true});
    onScroll();
  }

  // ── Shared form submission utility ──
  function submitForm(endpoint, data) {
    var ctrl = new AbortController();
    var timeoutId = setTimeout(function(){ ctrl.abort(); }, 15000);
    return fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: ctrl.signal
    }).then(function(res) {
      clearTimeout(timeoutId);
      return res.json().catch(function(){ return { success: false, error: 'Chyba serveru' }; }).then(function(json) {
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Chyba serveru');
        }
        return json;
      });
    }).catch(function(err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') throw new Error('Spojení trvalo příliš dlouho. Zkus to prosím znovu.');
      throw err;
    });
  }

  // Mobile menu drawer
  (function(){
    const toggle = document.getElementById('mobileToggle');
    const menu = document.getElementById('mobileMenu');
    const backdrop = document.getElementById('mobileMenuBackdrop');
    const icon = document.getElementById('mobileToggleIcon');
    if (!toggle || !menu || !backdrop) return;

    // Non-modal drawer: the page deliberately stays scrollable while the menu is
    // open, so no scroll lock is applied. The drawer is anchored to the sticky
    // header and follows the top of the viewport as the user scrolls.
    function open(){
      menu.setAttribute('aria-hidden','false');
      backdrop.setAttribute('aria-hidden','false');
      toggle.setAttribute('aria-expanded','true');
      toggle.setAttribute('aria-label','Zavřít menu');
      if (icon) icon.setAttribute('icon','lucide:x');
    }
    function close(){
      menu.setAttribute('aria-hidden','true');
      backdrop.setAttribute('aria-hidden','true');
      toggle.setAttribute('aria-expanded','false');
      toggle.setAttribute('aria-label','Otevřít menu');
      if (icon) icon.setAttribute('icon','lucide:menu');
    }
    toggle.addEventListener('click', () => {
      const isOpen = menu.getAttribute('aria-hidden') === 'false';
      isOpen ? close() : open();
    });
    backdrop.addEventListener('click', close);
    // Close on link click (smooth scroll to section then dismiss)
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
    // Close on Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && menu.getAttribute('aria-hidden') === 'false') close();
    });
    // Auto-close when resizing back to desktop
    const mq = window.matchMedia('(min-width: 981px)');
    mq.addEventListener('change', e => { if (e.matches) close(); });
  })();

  // Reveal on scroll
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, {threshold:.12});
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // C6b: Pause gp-spin-border animation when .btn-gold is off-screen (saves paint)
  // Class-based toggle so the ::after pseudo-element is also paused.
  // Also respects prefers-reduced-motion (reduced-motion users never spin).
  if ('IntersectionObserver' in window) {
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var spinObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        e.target.classList.toggle('anim-paused', reduceMotion || !e.isIntersecting);
      });
    }, {rootMargin: '200px'});
    document.querySelectorAll('.btn-gold').forEach(function(el) { spinObserver.observe(el); });
  }

