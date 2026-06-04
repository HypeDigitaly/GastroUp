# Cal.com Demo zdarma Modal — Rebuild on Official Loader

**Date:** 2026-06-04  
**Status:** Complete (Wave 1-3 executed)

---

## Why Rebuilt

### Bug Symptoms
When the Demo zdarma modal was invoked repeatedly, it would freeze, double-load, or become stuck with an unclosable overlay.

### Root Cause
Two compounding layers:

1. **Bespoke shadow state machine** (`src/js/cal-embed.js` previous version): The script injected a stub-only loader (with the real `embed.js` URL removed) and reimplemented the SDK's lifecycle with custom `pendingQueue`, `calReady`/`calFailed` flags, per-element `data-cal-loading` locks, and manual modal invocation. Any divergence between this shadow state and the SDK's internal state produced modal stacking, stuck-loading boxes, or "dead button" locking.

2. **Known cal.com SDK issues** (GitHub #17008/#17204/#19955): Repeated `modal()` calls against an inconsistent SDK state stack overlapping overlays with no `destroy` API; `state="loading"` stuck forever if `linkReady` event fails to fire; duplicate `<cal-modal-box>` creation when bypassing the SDK's own click binding.

### Solution
**Stop fighting the SDK.** Use the official loader verbatim, let the SDK bind clicks and own the full modal lifecycle, and add a thin hardening layer that only intervenes on the specific failure modes (stuck-loading, stacking, load failure).

---

## Architecture

### Official Loader + Warm-up Load
- The first 22 lines of `src/js/cal-embed.js` are the official cal.com embed loader IIFE verbatim, including the script injection.
- On page load, nothing requests `app.cal.com` — the visitor's consent posture is preserved.
- On the first **hover/touch/focus** of any `[data-cal-namespace][data-cal-link]` trigger (warm-up), the SDK initializes: `embed.js` downloads and the official loader binds all 6 Demo zdarma triggers.
- Warm-up is delegated and passive (no `preventDefault`), so no user interaction is blocked.

### SDK-Native Binding
Once the SDK loads, clicks on triggers are bound by the official SDK, not by custom code. The SDK opens the modal, manages its lifecycle (open, reopen-fast-path, close), and dispatches the `linkReady` event when content is ready.

### Early-Click Bridge
If a user clicks a trigger **before** `embed.js` finishes loading, the hardening listener:
1. Ensures init has fired (if warm-up hasn't yet).
2. Calls `Cal.ns['30min']('modal', {calLink, config})` **to the official stub queue** (not directly to the SDK).
3. Calls `e.preventDefault()` so `<a>` triggers don't also open a fallback tab the queued modal would duplicate.
4. Arms the stuck-loading watchdog.

The official stub queue is a FIFO buffer managed by the loader itself. When `embed.js` loads, the SDK drains all queued calls, including the early-click `modal()`. **No requests to `app.cal.com` happen until the user interacts with a trigger** — verified in test A1/A2.

### Readiness Detection
Readiness is **not** detected by `Cal.loaded` (set by the stub itself, guards script injection only). Instead:
- Poll `Cal.ns['30min'].instance` (only the real `embed.js` sets this) for 10 seconds (POLL_TRIES × POLL_INTERVAL = 50 × 200ms).
- Attach an `error` listener to the injected `<script>` element (safe in a later task).
- If poll exhausts or error fires, mark `failed`.

### Three Hardening Behaviors

#### 1. Stuck-Loading Watchdog
- Single shared timer (cleared and re-armed per click).
- On timeout (15 s), removes **only** boxes with `state="loading"` or `state="failed"`.
- **Never** removes a healthy loaded modal or a healthy reopened modal (preserves SDK fast-reopen path).
- Cleared by the official `linkReady` event.
- If boxes are removed, shows the fallback toast.

#### 2. Broken-Box Cleanup
- On each click, after the SDK is alive, remove any orphaned `state="loading"`/`state="failed"` boxes.
- If more than one `cal-modal-box` exists in the DOM, remove all (stacked overlays indicate desync).
- Single idle/closed box is preserved (SDK's fast-reopen uses the closed box).

#### 3. Failure Fallback
If the SDK failed to load (script error, poll exhaustion, or load grace window — 9 seconds from first click — blown):
- Call `e.preventDefault()`.
- Open the booking URL in a new tab: `window.open(CAL_URL, "_blank", "noopener")`.
- Show the fallback toast: "Kalendář se nepodařilo načíst — otevři rezervaci přímo".
- **Bail-out guard:** If `Cal.ns['30min'].instance` is present or any `cal-modal-box` exists, never fall back (SDK is demonstrably alive).

---

## Tuning Constants

| Constant | Value | Purpose |
|----------|-------|---------|
| `STUCK_MS` | 15000 | Watchdog timeout (ms). Modal loading >15s is effectively stuck. |
| `LOAD_GRACE_MS` | 9000 | Clicks >9s after first click w/o SDK → fallback (CDN timeout hedge). |
| `POLL_INTERVAL` | 200 | Readiness poll interval (ms). |
| `POLL_TRIES` | 50 | Poll attempts before failure. 50 × 200ms = 10s max wait. |

---

## Testing

### Run the Regression Suite
```bash
node build.js && node test-cal-modal.cjs
```

**Requirements:**
- Network access to `app.cal.com` and `cal.com` (fetches real embed.js).
- Playwright (already in `package.json`).

**Coverage (20 checks):**
- Open modal, close via X, reopen (verify no stacking).
- Rapid 5× invocation (no freeze, no duplicate overlays).
- Click two different triggers in succession (single modal).
- Click on nested `<span class="arrow">` (closest() works).
- Cold click (no hover, SDK not ready → early-click bridge + auto-open on load).
- Stuck-loading simulation (after 15s, loading box is removed and toast appears).
- Embed.js blocked (click → new tab + toast).

**Known Limitation:**
Escape key, X button, and backdrop click are all inside a cross-origin iframe (`<cal-modal-box>`). The hardening script cannot intercept them (no iframe access). The test suite verifies they work via `page.keyboard.press('Escape')` and checking the modal is gone, but this is manual-verification level testing. In production, these three close methods are relied upon — test on real devices if close behavior regresses.

---

## CSP Requirements

The current site has **no CSP enforce policy** (only Report-Only with no report URI). If a CSP is ever added, include:

```
script-src https://app.cal.com;
frame-src https://app.cal.com https://cal.com;
connect-src https://app.cal.com https://cal.com;
```

These are the only new sources needed. The embed loader injects `https://app.cal.com/embed/embed.js` and the modal loads content from `https://cal.com`.

---

## Rollback

If the rebuild causes unexpected issues:

```bash
# Identify the code commit (cal-embed.js + CSS cleanup + test script)
git log --oneline

# Revert
git revert <commit-sha>

# Verify
node build.js && node test-smoke.cjs && node test-consent.cjs
```

The change is confined to one JS file (+ 1 CSS line, + 1 standalone test script) with no markup or page structure changes. Revert is clean and low-risk.

---

## Files Changed

- `src/js/cal-embed.js` — Fully rewritten (117 → 183 lines, more comments).
- `src/styles/cookie-banner.css` — Removed dead `[data-cal-loading]` rule (1 line).
- `test-cal-modal.cjs` — New (170 lines, network-dependent, run on demand).
