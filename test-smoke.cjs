/**
 * Build-output smoke test: serves ./dist and drives Chromium through the
 * landing page + legal pages, asserting zero JS errors, visible key sections,
 * working accordion, checkout modal, mobile drawer, and lead popup trigger.
 * Run: npm run build && node test-smoke.cjs   (requires playwright installed)
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const DIST = path.join(__dirname, 'dist');
const PORT = 8788;
const BASE = `http://127.0.0.1:${PORT}`;

const MIME = { '.html': 'text/html; charset=utf-8', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon', '.xml': 'application/xml', '.txt': 'text/plain', '.webmanifest': 'application/manifest+json', '.pdf': 'application/pdf', '.md': 'text/markdown' };

function serve() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p === '/') p = '/index.html';
      let file = path.join(DIST, p);
      if (!fs.existsSync(file) && fs.existsSync(file + '.html')) file = file + '.html';
      if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        file = path.join(DIST, '404.html');
        res.statusCode = 404;
      }
      res.setHeader('Content-Type', MIME[path.extname(file)] || 'application/octet-stream');
      fs.createReadStream(file).pipe(res);
    });
    server.listen(PORT, '127.0.0.1', () => resolve(server));
  });
}

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log(`  PASS  ${name}${detail ? ' — ' + detail : ''}`); }
  else { fail++; console.log(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`); }
}

(async () => {
  const server = await serve();
  const browser = await chromium.launch();

  // ── 1. Landing page ──
  console.log('\n[1] Landing page renders without errors');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(BASE + '/', { waitUntil: 'load' });

    check('no JS page errors on load', errors.length === 0, errors.join(' | '));
    for (const sel of ['#nav', '.hero h1', '#vize', '#okruhy', '#situace', '#cena', '#ebook', '#poptavka', 'footer']) {
      check(`${sel} present + visible`, await page.locator(sel).first().isVisible());
    }
    check('nav logo visible', await page.locator('#nav .logo-img').isVisible());
    check('3 pricing cards', (await page.locator('.price-card').count()) === 3);
    check('7 vision cards', (await page.locator('.vision-card').count()) === 7);
    check('7 accordion items', (await page.locator('.acc-item').count()) === 7);
    check('7 cal.com triggers', (await page.locator('[data-cal-namespace]').count()) === 7);
    check('10 checkout triggers', (await page.locator('[data-checkout]').count()) === 10);

    // accordion opens (item 2 — item 1 starts open by default)
    const secondAcc = page.locator('.acc-item').nth(1);
    await secondAcc.locator('summary').click();
    await page.waitForTimeout(700);
    check('accordion item opens on click', await secondAcc.evaluate((el) => el.open && el.classList.contains('is-open')));

    // checkout modal opens + closes (FAPI script won't load locally; UI shell must still work)
    await page.locator('.price-card .btn[data-checkout]').first().click();
    await page.waitForTimeout(300);
    check('checkout modal opens', await page.locator('#checkoutModal').evaluate((el) => el.classList.contains('open')));
    check('checkout modal title set', (await page.locator('#coTitle').textContent()) !== '');
    await page.locator('#coClose').click();
    await page.waitForTimeout(300);
    check('checkout modal closes', await page.locator('#checkoutModal').evaluate((el) => !el.classList.contains('open')));

    // lead popup fires at 50% scroll
    await page.evaluate(() => window.scrollTo(0, (document.documentElement.scrollHeight - window.innerHeight) * 0.55));
    await page.waitForTimeout(600);
    check('lead popup shows at 50% scroll', await page.locator('#leadPopup').evaluate((el) => !el.hidden && el.getAttribute('aria-hidden') === 'false'));
    await page.locator('#lpClose').click();
    await page.waitForTimeout(500);
    check('lead popup dismissible', await page.locator('#leadPopup').evaluate((el) => el.getAttribute('aria-hidden') === 'true'));

    check('no JS errors after interactions', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  // ── 2. Mobile drawer ──
  console.log('\n[2] Mobile drawer (390px viewport)');
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(BASE + '/', { waitUntil: 'load' });
    await page.locator('#mobileToggle').click();
    await page.waitForTimeout(300);
    check('drawer opens', (await page.locator('#mobileMenu').getAttribute('aria-hidden')) === 'false');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    check('drawer closes on Escape', (await page.locator('#mobileMenu').getAttribute('aria-hidden')) === 'true');
    check('no JS errors (mobile)', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  // ── 3. Legal pages + 404 ──
  console.log('\n[3] Legal pages + 404');
  for (const route of ['/obchodni-podminky', '/ochrana-osobnich-udaju', '/nonexistent']) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(BASE + route, { waitUntil: 'load' });
    check(`[${route}] no JS errors`, errors.length === 0, errors.join(' | '));
    check(`[${route}] cookie banner present`, (await page.locator('#gp-cookie-banner').count()) === 1);
    if (route !== '/nonexistent') {
      check(`[${route}] header visible`, await page.locator('header.nav, header').first().isVisible());
      check(`[${route}] footer visible`, await page.locator('footer').isVisible());
      check(`[${route}] aria-current on own footer link`, (await page.locator(`footer a[aria-current="page"]`).count()) === 1);
    }
    await ctx.close();
  }

  await browser.close();
  server.close();
  console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
