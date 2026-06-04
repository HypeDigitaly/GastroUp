(function () {
  // ── Official cal.com embed loader (verbatim incl. script injection) ───────
  // The first Cal() call appends <script src="https://app.cal.com/embed/embed.js">.
  // Idempotent: cal.loaded guard prevents double injection.
  (function (C, A, L) {
    var p = function (a, ar) { a.q.push(ar); };
    var d = C.document;
    C.Cal = C.Cal || function () {
      var cal = C.Cal; var ar = arguments;
      if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; }
      if (ar[0] === L) {
        var api = function () { p(api, arguments); };
        var namespace = ar[1]; api.q = api.q || [];
        if (typeof namespace === "string") {
          cal.ns[namespace] = cal.ns[namespace] || api;
          p(cal.ns[namespace], ar); p(cal, ["initNamespace", namespace]);
        } else p(cal, ar);
        return;
      }
      p(cal, ar);
    };
  })(window, "https://app.cal.com/embed/embed.js", "init");

  var NS = "30min";
  var CAL_URL = "https://cal.com/jakub-h-a2wrvi/30min";
  var EMBED_SRC = "https://app.cal.com/embed/embed.js";
  var STUCK_MS = 15000;        // watchdog: modal stuck in state="loading"
  var LOAD_GRACE_MS = 9000;    // clicks this long after first click w/o SDK → fallback
  var POLL_INTERVAL = 200;     // SDK readiness poll
  var POLL_TRIES = 50;         // 50 × 200ms = 10s, then mark failed

  var initCalled = false;
  var sdkLoaded = false;       // real embed.js executed (instance present)
  var failed = false;          // script error or poll exhausted
  var clickQueued = false;     // an early click was bridged via the stub queue
  var firstClickAt = 0;
  var watchdogTimer = null;

  // ── Init: download embed.js + configure namespace (idempotent) ────────────
  function initCal() {
    if (initCalled) return;
    initCalled = true;
    Cal("init", NS, { origin: "https://cal.com" });
    Cal.ns[NS]("ui", {
      theme: "light",
      cssVarsPerTheme: { light: { "cal-brand": "#CC972D" } },
      hideEventTypeDetails: false,
      layout: "month_view"
    });
    // Official event: fires when embed content is ready — clears the watchdog.
    Cal.ns[NS]("on", {
      action: "linkReady",
      callback: function () {
        sdkLoaded = true;
        if (watchdogTimer) { clearTimeout(watchdogTimer); watchdogTimer = null; }
      }
    });
    detectLoad();
  }

  // ── SDK readiness detection ────────────────────────────────────────────────
  // NOTE: Cal.loaded is set by the STUB itself (guards script injection) and is
  // NOT a signal that embed.js executed. The real signal: embed.js assigns
  // Cal.ns[NS].instance when it initializes the namespace. Script 'error' events
  // always fire in a later task, so attaching the listener post-append is safe;
  // 'load' events are NOT used (cache race). Poll exhaustion also marks failure.
  function detectLoad() {
    var s = document.querySelector('script[src="' + EMBED_SRC + '"]');
    if (s) s.addEventListener("error", function () { markFailed(); });
    (function poll(tries) {
      if (sdkLoaded || failed) return;
      if (window.Cal && window.Cal.ns && window.Cal.ns[NS] && window.Cal.ns[NS].instance) {
        sdkLoaded = true;
        return;
      }
      if (tries <= 0) { markFailed(); return; }
      setTimeout(function () { poll(tries - 1); }, POLL_INTERVAL);
    })(POLL_TRIES);
  }

  function markFailed() {
    if (sdkLoaded || failed) return;
    failed = true;
    if (watchdogTimer) { clearTimeout(watchdogTimer); watchdogTimer = null; }
    // A click was waiting on the queue and will never be served — tell the user.
    if (clickQueued) showToast();
  }

  // ── Fallback toast (unchanged UX/CSS) ──────────────────────────────────────
  function showToast() {
    if (document.querySelector(".cal-fallback-toast")) return;
    var t = document.createElement("div");
    t.className = "cal-fallback-toast";
    t.innerHTML =
      'Kalendář se nepodařilo načíst — ' +
      '<a href="' + CAL_URL + '" target="_blank" rel="noopener">otevři rezervaci přímo</a>';
    document.body.appendChild(t);
  }

  function removeBrokenBoxes() {
    // Remove ONLY loading/failed boxes — never a healthy loaded/reopened modal.
    var boxes = document.querySelectorAll(
      'cal-modal-box[state="loading"], cal-modal-box[state="failed"]'
    );
    for (var i = 0; i < boxes.length; i++) boxes[i].remove();
    return boxes.length;
  }

  function removeAllBoxes() {
    var boxes = document.querySelectorAll("cal-modal-box");
    for (var i = 0; i < boxes.length; i++) boxes[i].remove();
  }

  // ── Stuck-loading watchdog (single shared timer, cleared by linkReady) ─────
  function armWatchdog() {
    if (watchdogTimer) clearTimeout(watchdogTimer);
    watchdogTimer = setTimeout(function () {
      watchdogTimer = null;
      if (removeBrokenBoxes() > 0) showToast();
    }, STUCK_MS);
  }

  // ── Warm-up: load SDK on first approach to any trigger ─────────────────────
  // Delegated + passive; pointerover/touchstart/focusin all bubble. No request
  // is made until the visitor interacts with a booking trigger (consent posture).
  function warmup(e) {
    if (initCalled) return;
    var t = e.target;
    if (t && t.closest && t.closest("[data-cal-namespace][data-cal-link]")) initCal();
  }
  document.addEventListener("pointerover", warmup, { capture: true, passive: true });
  document.addEventListener("touchstart", warmup, { capture: true, passive: true });
  document.addEventListener("focusin", warmup, true);

  // ── Hardening click listener (capture phase) ───────────────────────────────
  // Never preventDefaults on the happy path — the SDK's own bound handler opens
  // the modal. Intercepts ONLY on the failure branch and the early-click bridge.
  document.addEventListener("click", function (e) {
    var trigger = e.target && e.target.closest
      ? e.target.closest("[data-cal-namespace][data-cal-link]")
      : null;
    if (!trigger) return;

    if (!firstClickAt) firstClickAt = Date.now();

    // Bail-out guard: if the SDK is demonstrably alive, never fall back.
    var sdkAlive = sdkLoaded || !!document.querySelector("cal-modal-box");

    // Failure fallback: script errored / poll exhausted / grace window blown.
    if (failed || (!sdkAlive && Date.now() - firstClickAt > LOAD_GRACE_MS)) {
      e.preventDefault();
      window.open(CAL_URL, "_blank", "noopener");
      showToast();
      return;
    }

    // Early-click bridge: SDK not ready yet → ensure init and queue the modal
    // open via the OFFICIAL stub queue (drained by embed.js the moment it loads).
    // preventDefault so <a> triggers don't ALSO open a tab the queued modal
    // would duplicate.
    if (!sdkAlive) {
      e.preventDefault();
      initCal();
      clickQueued = true;
      Cal.ns[NS]("modal", {
        calLink: trigger.getAttribute("data-cal-link") || "jakub-h-a2wrvi/30min",
        config: { layout: "month_view" }
      });
      armWatchdog();
      return;
    }

    // SDK alive: clean up broken boxes so the SDK creates/reuses a healthy one.
    // A single idle/closed box is preserved → SDK fast "reopened" path intact.
    removeBrokenBoxes();
    var all = document.querySelectorAll("cal-modal-box");
    if (all.length > 1) removeAllBoxes(); // stacked overlays → force fresh box

    armWatchdog();
    // No preventDefault — the SDK's bound handler opens the modal.
  }, true);
})();
