/**
 * Functional test: cookie consent banner + GA4 Consent Mode v2
 * Serves ./dist locally and drives a real Chromium browser through
 * accept / decline / persistence / reopen flows.
 * Run: node test-consent.cjs   (requires playwright installed)
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const DIST = path.join(__dirname, 'dist');
const PORT = 8787;
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

function trackGA(page, store) {
  page.on('request', (req) => {
    const u = req.url();
    if (u.includes('google-analytics.com') || u.includes('analytics.google.com')) store.collect.push(u);
    if (u.includes('googletagmanager.com/gtag/js')) store.gtagJs.push(u);
  });
}

// gcs param: G1xy — x = ad_storage, y = analytics_storage (0=denied, 1=granted)
function gcsOf(urls) {
  return urls.map((u) => { const m = u.match(/[?&]gcs=([^&]+)/); return m ? m[1] : null; }).filter(Boolean);
}

(async () => {
  // Fail-fast: dist/obchodni-podminky.html must exist before running any tests
  const distObchodni = path.join(DIST, 'obchodni-podminky.html');
  if (!fs.existsSync(distObchodni)) {
    console.error('\nFAIL  dist/obchodni-podminky.html is missing — run node build.js first');
    process.exit(1);
  }

  const server = await serve();
  const browser = await chromium.launch();

  // ---------- Scenario 1: first visit + ACCEPT ----------
  console.log('\n[1] First visit + Accept');
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const ga = { collect: [], gtagJs: [] };
    trackGA(page, ga);
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });

    check('banner visible on first visit', await page.locator('#gp-cookie-banner').isVisible());
    check('gtag.js loaded from googletagmanager.com', ga.gtagJs.length > 0, ga.gtagJs[0]);
    check('no consent stored yet', (await page.evaluate(() => localStorage.getItem('gp_cookie_consent'))) === null);

    const cookiesBefore = (await ctx.cookies()).filter((c) => c.name.startsWith('_ga'));
    check('no _ga cookies before consent', cookiesBefore.length === 0, JSON.stringify(cookiesBefore.map((c) => c.name)));

    const preGcs = gcsOf(ga.collect);
    check('pre-consent hits (if any) are denied (gcs=G1_0_)', preGcs.every((g) => g.endsWith('0')), `hits: ${ga.collect.length}, gcs: ${JSON.stringify(preGcs)}`);

    // consent state per gtag internals
    const denied = await page.evaluate(() => {
      const dl = window.dataLayer || [];
      return dl.some((e) => e[0] === 'consent' && e[1] === 'default' && e[2] && e[2].analytics_storage === 'denied');
    });
    check('dataLayer has consent default denied', denied);

    const preCount = ga.collect.length;
    await page.click('#gp-cookie-banner .gp-cb-accept');
    await page.waitForTimeout(8000); // GA batches the post-consent hit ~5s later

    check('banner hidden after accept', !(await page.locator('#gp-cookie-banner').isVisible()));
    check("localStorage = 'granted'", (await page.evaluate(() => localStorage.getItem('gp_cookie_consent'))) === 'granted');

    const cookiesAfter = (await ctx.cookies()).filter((c) => c.name.startsWith('_ga'));
    check('_ga cookies set after accept', cookiesAfter.length > 0, cookiesAfter.map((c) => c.name).join(', '));

    const postHits = ga.collect.slice(preCount);
    const postGcs = gcsOf(postHits);
    check('GA hit sent after accept with analytics granted (gcs=G1_1)', postGcs.some((g) => g.endsWith('1')), `new hits: ${postHits.length}, gcs: ${JSON.stringify(postGcs)}`);

    const cid = await page.evaluate(() => new Promise((r) => { try { gtag('get', 'G-VR866S5JF5', 'client_id', r); setTimeout(() => r(null), 3000); } catch (e) { r('ERR:' + e.message); } }));
    check('gtag returns client_id', typeof cid === 'string' && /^\d+\.\d+$/.test(cid), String(cid));

    // persistence: reload
    const ga2 = { collect: [], gtagJs: [] };
    const page2 = await ctx.newPage();
    trackGA(page2, ga2);
    await page2.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page2.waitForTimeout(6000);
    check('banner stays hidden on revisit after accept', !(await page2.locator('#gp-cookie-banner').isVisible()));
    const revisitGcs = gcsOf(ga2.collect);
    check('revisit hit is granted from the start (localStorage restore)', revisitGcs.some((g) => g.endsWith('1')), JSON.stringify(revisitGcs));

    // reopen via footer link
    await page2.locator('.gp-cookie-settings').first().click();
    check('banner reopens via "Nastavení cookies" footer link', await page2.locator('#gp-cookie-banner').isVisible());
    check('reopen clears stored choice', (await page2.evaluate(() => localStorage.getItem('gp_cookie_consent'))) === null);
    await ctx.close();
  }

  // ---------- Scenario 2: first visit + DECLINE ----------
  console.log('\n[2] First visit + Decline');
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const ga = { collect: [], gtagJs: [] };
    trackGA(page, ga);
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.click('#gp-cookie-banner .gp-cb-decline');
    await page.waitForTimeout(2000);

    check('banner hidden after decline', !(await page.locator('#gp-cookie-banner').isVisible()));
    check("localStorage = 'denied'", (await page.evaluate(() => localStorage.getItem('gp_cookie_consent'))) === 'denied');
    const gaCookies = (await ctx.cookies()).filter((c) => c.name.startsWith('_ga'));
    check('no _ga cookies after decline', gaCookies.length === 0, JSON.stringify(gaCookies.map((c) => c.name)));
    const gcs = gcsOf(ga.collect);
    check('no granted GA hits after decline', gcs.every((g) => g.endsWith('0')), `hits: ${ga.collect.length}, gcs: ${JSON.stringify(gcs)}`);

    const page2 = await ctx.newPage();
    await page2.goto(BASE + '/', { waitUntil: 'networkidle' });
    check('banner stays hidden on revisit after decline', !(await page2.locator('#gp-cookie-banner').isVisible()));
    await ctx.close();
  }

  // ---------- Scenario 3: 404 + privacy pages ----------
  console.log('\n[3] 404 and privacy-policy pages');
  for (const p of ['/nonexistent-page', '/ochrana-osobnich-udaju', '/obchodni-podminky']) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const ga = { collect: [], gtagJs: [] };
    trackGA(page, ga);
    await page.goto(BASE + p, { waitUntil: 'networkidle' });
    check(`[${p}] banner visible on first visit`, await page.locator('#gp-cookie-banner').isVisible());
    check(`[${p}] gtag.js loads`, ga.gtagJs.length > 0);
    await page.click('#gp-cookie-banner .gp-cb-accept');
    await page.waitForTimeout(1500);
    check(`[${p}] accept stores consent`, (await page.evaluate(() => localStorage.getItem('gp_cookie_consent'))) === 'granted');
    await ctx.close();
  }

  // ---------- Scenario 6: /obchodni-podminky — accept then reopen via footer link ----------
  console.log('\n[6] /obchodni-podminky — accept then reopen via .gp-cookie-settings');
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(BASE + '/obchodni-podminky', { waitUntil: 'networkidle' });
    await page.click('#gp-cookie-banner .gp-cb-accept');
    await page.waitForTimeout(1500);
    check('[/obchodni-podminky] banner hidden after accept', !(await page.locator('#gp-cookie-banner').isVisible()));
    await page.locator('.gp-cookie-settings').first().click();
    await page.waitForTimeout(500);
    check('[/obchodni-podminky] banner reopens via .gp-cookie-settings footer link', await page.locator('#gp-cookie-banner').isVisible());
    await ctx.close();
  }

  await browser.close();
  server.close();
  console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
