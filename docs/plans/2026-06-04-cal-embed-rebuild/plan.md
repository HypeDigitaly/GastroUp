# Cal.com "Demo zdarma" Booking Modal — Rebuild Plan

**Date:** 2026-06-04
**Status:** Reviewed (architect-reviewer + javascript-pro: APPROVE WITH CHANGES — all required changes incorporated) — **revision 2, ready for execution**
**Scope:** `src/js/cal-embed.js` rewrite + 1-line CSS cleanup + verification + docs

---

## 1. Bug Summary & Root Cause

### Symptom
When the cal.com "Demo zdarma" modal is invoked repeatedly, it freezes or double-loads
and cannot be closed.

### Root cause (two compounding layers)

**Layer A — bespoke lazy-load plumbing (`src/js/cal-embed.js`, current).**
The current file ships a *stub-only* version of the official loader IIFE: the
script-injection line was deliberately removed and the loader URL replaced with an empty
string `(window,'','init')` (line 20). The real `embed.js` is instead injected by hand in
`initAndOpen()` on the first click, behind a custom `pendingQueue`, a `calReady`/`calFailed`
state machine, an 8-second timeout, and a per-element `data-cal-loading` lock. This hand-rolled
lifecycle is the freeze surface:
- The custom click handler always calls `e.preventDefault()` and re-implements open/queue/lock
  logic the SDK provides natively. Any divergence between this shadow state machine and the SDK's
  internal state produces an inconsistent SDK — the precondition for the modal-stacking and
  stuck-loading failure modes below.
- `data-cal-loading` is set on click and only cleared by `restore()` inside `onload`/`failHandler`.
  If those paths don't run as expected, the element stays locked (`pointer-events:none`) — a
  "dead button" that looks like a freeze.
- Manual `modal()` calls bypass the SDK's own click binding, so the SDK's internal "is a modal
  already open for this link" bookkeeping is never primed by a real bound click, increasing the
  chance of duplicate `<cal-modal-box>` creation.

**Layer B — known cal.com SDK modal-lifecycle issues (researched).**
1. **Orphaned `<cal-modal-box>` stacking** — repeated `modal()` calls against an inconsistent SDK
   state stack overlapping overlays that cannot be closed (GitHub #17008, #17204). There is no
   `destroy` API; the only cleanup is manual removal of `<cal-modal-box>` elements.
2. **Stuck `state="loading"`** — if the `linkReady` event never fires (e.g. blocked by a 3rd-party
   script or CDN hiccup), the modal sits in `state="loading"` forever (#19955).
3. **Reopen fast-path** — reopening the same link within ~60s takes a `state="reopened"` fast path;
   after slot staleness it does a `fullReload` (slow, transient blank state). Aggressively removing
   the closed box on every reopen would *break* the healthy fast path.

The fix: stop fighting the SDK. Use the **official loader verbatim**, let the SDK bind clicks and
own the full modal lifecycle, and add a **thin hardening layer** that only intervenes on the
specific failure modes (stuck-loading, stacking, load failure).

---

## 2. User-Approved Decisions

1. **Approach:** official declarative pattern — official loader IIFE verbatim, SDK auto-binds
   `[data-cal-namespace][data-cal-link]` triggers, zero custom open code on the happy path.
2. **Load timing:** **interaction warm-up** (revised from "on idle" after review surfaced a
   consent regression — idle-load would contact `app.cal.com` for every visitor pre-consent,
   inconsistent with the site's Consent Mode v2 posture). `embed.js` loads on the first
   hover / touch / focus of any Demo zdarma trigger; a click that lands before the SDK is ready
   is bridged via cal.com's **official stub queue** (the queued `modal` call executes the moment
   `embed.js` loads). No background third-party request for visitors who never approach a
   booking trigger — the current privacy posture is preserved.

---

## 3. Goals / Non-Goals

### Goals
- Modal opens reliably and **closes** via X button, Escape, and backdrop click — every time.
- Rapid re-invocation (5×), reopen-after-close, and clicking two different triggers in succession
  all work without freeze or duplicate overlays.
- No dead clicks: a click before `embed.js` is ready queues the modal open via the official stub
  queue and the modal opens automatically when loaded.
- Graceful degradation when `embed.js` cannot load (CDN/offline/blocked): clicking a trigger opens
  the booking URL in a new tab; keep the existing fallback toast UX.
- No pre-consent third-party requests for passive visitors (warm-up is interaction-gated).
- Preserve brand styling (light theme, `cal-brand:#CC972D`, `month_view`) and the 6 existing
  invocation points unchanged.
- Build pipeline, smoke tests, and consent tests stay green; add an automated modal regression
  check (this is the third attempt at this bug — a static trigger count is not enough).

### Non-Goals
- No change to the visual design of the buttons/links or page copy.
- No change to the cal.com account/event (`jakub-h-a2wrvi/30min`).
- No new build tooling, no watch mode, no new runtime dependencies.
- No rewrite of git history; the old design note in the code-review doc gets an amendment pointer.

---

## 4. New `src/js/cal-embed.js` — Full Proposed Source (rev 2, review fixes applied)

Review fixes incorporated:
- **R1 (load detection):** no `load`-event listener on the injected `<script>` (cache race — the
  event can fire before the listener attaches). Readiness is detected by polling
  `Cal.ns['30min'].instance` — set **only** when the real `embed.js` executes (the stub never sets
  it; note `Cal.loaded` is set by the *stub* itself and is NOT a valid signal). `error` on the
  script element is kept (error events always fire in a later task — safe) and poll exhaustion
  (10 s) also marks failure.
- **R2 (early-click bridge):** a click before SDK readiness forces init (if warm-up hasn't fired)
  and pushes `Cal.ns['30min']('modal', {calLink})` to the **official stub queue** — drained by
  `embed.js` on load. `preventDefault` is called on this branch so `<a>` triggers don't also open
  a tab that the queued modal would duplicate.
- **R3 (watchdog):** single shared timer (clear + re-arm per click), removes **only**
  `state="loading"`/`state="failed"` boxes — never a healthy loaded modal; cleared by the official
  `linkReady` event. `STUCK_MS` raised to 15 s to avoid killing a slow-but-recovering iframe.
- **R4 (no false fallback):** the failure branch additionally bails out if the SDK is demonstrably
  alive (`instance` present or a `cal-modal-box` exists in the DOM).
- **R5 (no idle scheduling at all):** superseded by interaction warm-up — `initCal()` fires on
  first `pointerover`/`touchstart`/`focusin` over a trigger (delegated, passive), or on click.

```javascript
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
```

> **Implementer notes**
> - ES5 only (no arrows/template literals) — survives `html-minifier-terser` `minifyJS` untouched
>   in behavior (locals get mangled, globals/strings don't). Do **not** enable `mangle.toplevel`.
> - If `Cal.ns[NS].instance` turns out not to be exposed in the production embed.js build, the
>   approved alternate readiness signal is: queue `Cal.ns[NS]("on", {action:"linkReady",...})`
>   (already present) **plus** treat the first appearance of a `cal-modal-box` after a queued
>   click as proof of life. Verify `instance` exists in DevTools during Wave 2 before relying on
>   the poll; adjust the poll predicate if needed (this is the only intentionally
>   verify-at-runtime point in the plan).
> - The early-click bridge calls `e.preventDefault()` **before** the SDK is bound, so it cannot
>   swallow a real SDK-bound click (once bound, `sdkAlive` is true and the branch is skipped).

---

## 5. Exact Changes Per File

### 5.1 `src/js/cal-embed.js` — **full rewrite**
Replace the entire 117-line file with the source in §4. Removed: `pendingQueue`, `openModal()`,
per-element `data-cal-loading` lock, manual per-element listeners, stub-only loader.

### 5.2 `src/components/cal-button.html` — **no change (keep `<button>`)**
SDK binds clicks on `[data-cal-namespace][data-cal-link]` regardless of element type; the
failure fallback `window.open(CAL_URL)` covers buttons. Switching to `<a href>` would risk visual
regressions across 4 styled call-sites for no robustness gain.

### 5.3 `src/components/cal-link.html` — **no change**
Real `href` + `target="_blank"` + `rel="noopener"` stays: when the SDK is bound it preventDefaults
(modal); when nothing is bound at all (JS disabled), the native href works.

### 5.4 `src/styles/cookie-banner.css` — **remove dead rule, keep toast**
- Keep `.cal-fallback-toast` and `.cal-fallback-toast a`.
- Remove the now-dead `[data-cal-loading]{opacity:.7;pointer-events:none;cursor:wait}` rule
  (nothing sets that attribute anymore).

### 5.5 `src/pages/index.html` + 6 invocation points — **no change**
The `<!-- @include js/cal-embed.js -->` at `src/pages/index.html:42` stays; `hero.html:14`,
`okruhy.html:10`, `pricing.html:76`, `contact.html:65`, `founder.html:30`, `footer.html:33`
keep their existing include directives. cal-embed.js ships only on index.html (verified — legal
pages and 404 don't include it).

### 5.6 Tests
- `test-smoke.cjs:63` (`6 cal.com triggers` via `[data-cal-namespace]` count) — still valid, keep.
- Keep automated smoke tests network-independent.
- **NEW (review-required):** add an automated modal regression check (Playwright, run against
  `dist/` via `scripts/serve.js`): open modal → close via X → reopen → assert
  `document.querySelectorAll('cal-modal-box').length <= 1` and page interactive. Lives as a
  standalone script (e.g. `test-cal-modal.mjs`), run on demand (needs network to app.cal.com) —
  not wired into the network-independent default test suite.

---

## 6. Execution Waves (for the `xecutor` skill)

### Wave 1 — Implementation (agent: `javascript-pro`)
1. Rewrite `src/js/cal-embed.js` with the §4 source.
2. Remove dead `[data-cal-loading]` rule from `src/styles/cookie-banner.css` (keep toast rules).
3. Leave components/pages/sections unchanged.
4. Self-check: single IIFE, ES5 only, no references to removed
   `pendingQueue`/`openModal`/`data-cal-loading`.

### Wave 2 — Build + Verify (agents: `frontend-developer` + `qa-expert`; depends on Wave 1)
Automated:
1. `node build.js` — succeeds; integrity gates pass.
2. `node test-smoke.cjs` — all 38 green (esp. `6 cal.com triggers`).
3. `node test-consent.cjs` — all green.
4. Minifier check: `dist/index.html` contains `app.cal.com/embed/embed.js` and
   `data-cal-namespace`; loader IIFE intact.
5. **Runtime verification of the readiness signal:** in DevTools/Playwright, confirm
   `Cal.ns['30min'].instance` becomes truthy after embed.js loads; if not, switch the poll
   predicate per the §4 implementer note.
6. New Playwright regression script: open → close (X) → reopen → box count ≤ 1.

Manual / Playwright checklist (against built `dist/` served via `scripts/serve.js`):
- [ ] **No request to `app.cal.com` on page load** (warm-up = consent posture preserved);
      first request happens only on hover/touch/focus/click of a trigger.
- [ ] Hover a trigger, then click — modal opens instantly (warm-up paid off), month view + gold brand.
- [ ] Cold click (no hover, e.g. tap on mobile emulation) — modal opens automatically when
      embed.js finishes (early-click bridge via stub queue), no dead click.
- [ ] Close via **X** / **Escape** / **backdrop** — overlay fully removed each way, page interactive.
- [ ] **Reopen 5× rapidly** — no stacking, no freeze, closes each time.
- [ ] **Reopen after close** — fast "reopened" path (no blank reload); single idle box preserved.
- [ ] **Two different triggers in succession** (hero button → footer link) — single modal,
      `cal-modal-box` count ≤ 1.
- [ ] Click directly on a child `<span class="arrow">` inside a button — still opens (closest()).
- [ ] **embed.js blocked** (DevTools block `app.cal.com`) → click opens booking URL in new tab +
      toast appears; `<a>` triggers also covered.
- [ ] **Stuck-loading** (throttle/sever network mid-load) — after 15 s the loading box is removed
      and the toast appears; a healthy loaded modal is never removed by the watchdog.
- [ ] After any sequence above: `document.querySelectorAll('cal-modal-box').length` ≤ 1.

### Wave 3 — Docs + Changelog (agent: `documentation-engineer`; depends on Wave 2)
1. `CHANGELOG.md` — `### Fixed`: rebuild on official loader + interaction warm-up + SDK-native
   binding + hardening layer; fixes repeated-invocation freeze/double-load/unclosable modal.
2. New `docs/cal-embed-rebuild-2026-06-04.md`: architecture, the three hardening behaviors
   (watchdog, broken-box cleanup, failure fallback), early-click bridge, warm-up consent
   rationale, tuning constants, and the CSP note below.
3. `docs/code-review-2026-06-04-componentization.md` — one-line amendment pointer near F3: the
   lazy-load design described there was superseded 2026-06-04 by the official-loader rebuild;
   line references in that review are stale. Do not rewrite.

---

## 7. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| `Cal.ns[NS].instance` not exposed as readiness signal in production embed.js. | Wave 2 step 5 verifies at runtime before shipping; approved alternate predicate documented in §4 implementer note (linkReady + box presence). |
| Early-click bridge queues a modal that never opens (embed.js hangs — no error, no load). | Poll exhaustion (10 s) marks `failed` and shows the toast (`clickQueued` flag); next click falls back to `window.open`. |
| Watchdog kills a slow-but-healthy modal. | Single shared timer, 15 s budget, removes only `loading`/`failed` boxes, cleared by official `linkReady` event. A modal loading >15 s is effectively stuck for the user; toast offers recovery. |
| False fallback on a working SDK (detection bug). | Failure branch bails out when `instance` present **or** any `cal-modal-box` exists; script `load` event deliberately not used (cache race). |
| cal.com CDN failure / ad-blocker / offline. | `error` handler + poll exhaustion → `window.open(CAL_URL)` + toast; `<a>` native href as last resort. Popup is user-gesture-attributed (inside click handler) — not blocked. |
| Minifier mangles the loader IIFE (`html-minifier-terser`, `minifyJS:true`). | ES5-only source; terser mangles only locals. Wave 2 step 4 verifies built output. Do not add `mangle.toplevel`. |
| Over-aggressive cleanup breaks the SDK fast-reopen path. | Single idle/closed box is never removed; only `loading`/`failed` boxes or a `>1` stack are wiped. Explicit checklist item. |
| Capture listener swallows SDK clicks. | `preventDefault` only on the failure branch and the pre-bind early-click bridge (SDK not bound yet by definition). |
| Consent/GDPR. | Resolved by design: zero `app.cal.com` requests until the visitor interacts with a booking trigger (asserted in Wave 2 checklist item 1). |
| Future CSP rollout breaks the embed. | Documented in Wave 3 docs note: requires `script-src https://app.cal.com`, `frame-src https://app.cal.com https://cal.com`, `connect-src https://app.cal.com https://cal.com`. No CSP exists today. |

---

## 8. Rollback Plan

Code changes land in a **single commit** (cal-embed.js rewrite + 1-line CSS cleanup + new test
script); Wave 3 docs in a separate commit. Rollback:

```
git revert <code-commit-sha>
node build.js && node test-smoke.cjs && node test-consent.cjs
```

Confined to one JS file (+1 CSS line, +1 standalone test script) with no markup/page structure
changes — revert is clean and low-risk.
