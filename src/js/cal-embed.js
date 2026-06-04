  (function(){
    // Cal stub queue — captures calls before embed.js loads so nothing is lost
    (function(C,A,L){
      var p=function(a,ar){a.q.push(ar);};
      var d=C.document;
      C.Cal=C.Cal||function(){
        var cal=C.Cal;var ar=arguments;
        if(!cal.loaded){cal.ns={};cal.q=cal.q||[];cal.loaded=true;}
        if(ar[0]===L){
          var api=function(){p(api,arguments);};
          var namespace=ar[1];api.q=api.q||[];
          if(typeof namespace==='string'){
            cal.ns[namespace]=cal.ns[namespace]||api;
            p(cal.ns[namespace],ar);p(cal,['initNamespace',namespace]);
          } else p(cal,ar);
          return;
        }
        p(cal,ar);
      };
    })(window,'','init');

    var CAL_URL = 'https://cal.com/jakub-h-a2wrvi/30min';
    var calReady = false;
    var calFailed = false;
    var pendingQueue = [];

    function openModal(calLink) {
      Cal.ns['30min']('modal', { calLink: calLink, config: { layout: 'month_view' } });
    }

    function showToast() {
      if (document.querySelector('.cal-fallback-toast')) return;
      var t = document.createElement('div');
      t.className = 'cal-fallback-toast';
      t.innerHTML = 'Kalendář se nepodařilo načíst — ' +
        '<a href="' + CAL_URL + '" target="_blank" rel="noopener">otevři rezervaci přímo<\/a>';
      document.body.appendChild(t);
    }

    function initAndOpen(calLink) {
      if (calReady) { openModal(calLink); return; }
      if (document.querySelector('script[data-cal-embed]')) return; // already loading

      // Queue init + ui BEFORE the script loads — embed.js requires a populated
      // Cal.q at execution time, otherwise it bails and never processes the queue.
      Cal('init', '30min', { origin: 'https://cal.com' });
      Cal.ns['30min']('ui', {
        theme: 'light',
        cssVarsPerTheme: { light: { 'cal-brand': '#CC972D' } },
        hideEventTypeDetails: false,
        layout: 'month_view'
      });

      var s = document.createElement('script');
      s.setAttribute('data-cal-embed', '');
      s.src = 'https://app.cal.com/embed/embed.js';

      var failHandlerCalled = false;
      var calTimer = null;

      function failHandler() {
        if (failHandlerCalled) return;
        failHandlerCalled = true;
        clearTimeout(calTimer);
        calFailed = true;
        var i;
        for (i = 0; i < pendingQueue.length; i++) {
          pendingQueue[i].restore();
        }
        pendingQueue = [];
        showToast();
      }

      s.onerror = failHandler;
      calTimer = setTimeout(failHandler, 8000);

      s.onload = function() {
        clearTimeout(calTimer);
        calReady = true;
        var i;
        for (i = 0; i < pendingQueue.length; i++) {
          pendingQueue[i].restore();
        }
        // Open only the most recent click — replaying every queued entry
        // would fire multiple modal() calls back-to-back.
        if (pendingQueue.length) {
          openModal(pendingQueue[pendingQueue.length - 1].calLink);
        }
        pendingQueue = [];
      };

      document.head.appendChild(s);
    }

    var els = document.querySelectorAll('[data-cal-namespace]');
    var idx;
    for (idx = 0; idx < els.length; idx++) {
      (function(el) {
        el.addEventListener('click', function(e) {
          e.preventDefault();
          if (calFailed) { window.open(CAL_URL, '_blank'); return; }
          if (el.dataset.calLoading) return;
          el.dataset.calLoading = '1';
          var calLink = el.getAttribute('data-cal-link');
          var restore = function() { delete el.dataset.calLoading; };
          if (calReady) {
            restore();
            openModal(calLink);
          } else {
            pendingQueue.push({ calLink: calLink, restore: restore });
            initAndOpen(calLink);
          }
        });
      })(els[idx]);
    }
  })();
