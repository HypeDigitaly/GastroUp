'use strict';
/**
 * GastroUp Brand Asset Generator
 * Generates: og-image.png, favicon-512.png, favicon-192.png,
 *            apple-touch-icon.png, favicon.ico
 *
 * Method for favicon.ico: png-to-ico (encodes 16/32/48 PNG layers into ICO)
 */

const sharp = require('sharp');
const pngToIcoMod = require('png-to-ico');
const pngToIco = pngToIcoMod.default || pngToIcoMod.imagesToIco || pngToIcoMod;
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

// Brand colors
const NAVY    = { r: 6,   g: 38,  b: 76  };
const GOLD    = { r: 204, g: 151, b: 45  };
const CREAM   = { r: 239, g: 227, b: 211 };

// Paths
const LOGO_FULL  = path.join(ROOT, 'Logo_GastroUp_2_transparent.png');  // wide logo w/ text
const LOGO_MARK  = path.join(ROOT, 'brand-assets', 'Logo_GastroUp.png'); // robot circle mark

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Convert hex to {r,g,b} */
function hex(h) {
  const n = parseInt(h.replace('#',''), 16);
  return { r: (n>>16)&255, g: (n>>8)&255, b: n&255 };
}

/** Build a solid color PNG buffer of given size */
async function solidColor(w, h, color) {
  return sharp({
    create: { width: w, height: h, channels: 3, background: color }
  }).png().toBuffer();
}

/** Resize the logomark to fit inside a square with given padding, return composite input */
async function resizeLogomark(targetSquare, padding = 0) {
  const inner = targetSquare - padding * 2;
  const buf = await sharp(LOGO_MARK)
    .resize(inner, inner, { fit: 'contain', background: { r:0,g:0,b:0,alpha:0 } })
    .png()
    .toBuffer();
  return { input: buf, top: padding, left: padding };
}

// ─── 1. og-image.png  (1200×630) ─────────────────────────────────────────────
async function makeOgImage() {
  const W = 1200, H = 630;
  console.log('  Building og-image.png...');

  // ---------- SVG: full composition with AI product card layout ----------------
  // Left column: badge + headline + subtitle + domain
  // Right column: abstract AI circuit / node decoration + logo below
  const bgSvg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <!-- Deep navy gradient: darker bottom-right corner for depth -->
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#0A2E5C"/>
      <stop offset="55%"  stop-color="#06264C"/>
      <stop offset="100%" stop-color="#020F1F"/>
    </linearGradient>
    <!-- Soft gold radial glow anchored to right panel -->
    <radialGradient id="rightGlow" cx="78%" cy="48%" r="38%">
      <stop offset="0%"   stop-color="#CC972D" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="#06264C" stop-opacity="0"/>
    </radialGradient>
    <!-- Subtle blue glow top-left behind text -->
    <radialGradient id="leftGlow" cx="22%" cy="38%" r="48%">
      <stop offset="0%"   stop-color="#1252A0" stop-opacity="0.30"/>
      <stop offset="100%" stop-color="#06264C" stop-opacity="0"/>
    </radialGradient>
    <!-- Gold fade for horizontal rules -->
    <linearGradient id="goldRule" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   stop-color="#CC972D" stop-opacity="0"/>
      <stop offset="8%"   stop-color="#CC972D" stop-opacity="1"/>
      <stop offset="70%"  stop-color="#CC972D" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="#CC972D" stop-opacity="0"/>
    </linearGradient>
    <!-- Vertical divider gradient -->
    <linearGradient id="divider" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"   stop-color="#CC972D" stop-opacity="0"/>
      <stop offset="20%"  stop-color="#CC972D" stop-opacity="0.35"/>
      <stop offset="80%"  stop-color="#CC972D" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#CC972D" stop-opacity="0"/>
    </linearGradient>
    <!-- Node pulse ring (AI effect) -->
    <radialGradient id="nodeRing" cx="50%" cy="50%" r="50%">
      <stop offset="60%"  stop-color="#CC972D" stop-opacity="0"/>
      <stop offset="85%"  stop-color="#CC972D" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#CC972D" stop-opacity="0"/>
    </radialGradient>
    <!-- Badge pill gradient -->
    <linearGradient id="badgeFill" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   stop-color="#CC972D" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#E5AE3D" stop-opacity="0.12"/>
    </linearGradient>
  </defs>

  <!-- ── Background layers ── -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#leftGlow)"/>
  <rect width="${W}" height="${H}" fill="url(#rightGlow)"/>

  <!-- ── Subtle dot-grid texture (right panel feel, sparse) ── -->
  <circle cx="680" cy="80"  r="1.2" fill="#CC972D" opacity="0.11"/>
  <circle cx="760" cy="80"  r="1.2" fill="#CC972D" opacity="0.11"/>
  <circle cx="840" cy="80"  r="1.2" fill="#CC972D" opacity="0.11"/>
  <circle cx="920" cy="80"  r="1.2" fill="#CC972D" opacity="0.11"/>
  <circle cx="1000" cy="80" r="1.2" fill="#CC972D" opacity="0.11"/>
  <circle cx="1080" cy="80" r="1.2" fill="#CC972D" opacity="0.11"/>
  <circle cx="720" cy="120"  r="1.2" fill="#CC972D" opacity="0.08"/>
  <circle cx="800" cy="120"  r="1.2" fill="#CC972D" opacity="0.08"/>
  <circle cx="880" cy="120"  r="1.2" fill="#CC972D" opacity="0.08"/>
  <circle cx="960" cy="120"  r="1.2" fill="#CC972D" opacity="0.08"/>
  <circle cx="1040" cy="120" r="1.2" fill="#CC972D" opacity="0.08"/>
  <circle cx="1120" cy="120" r="1.2" fill="#CC972D" opacity="0.08"/>

  <!-- ── Vertical divider ── -->
  <rect x="630" y="0" width="1.5" height="${H}" fill="url(#divider)"/>

  <!-- ══════════════════════════════════════════════
       RIGHT PANEL: AI Circuit / Brain Node diagram
       ══════════════════════════════════════════════ -->

  <!-- Connection lines (neural network style) -->
  <!-- Central hub → satellite nodes -->
  <line x1="900" y1="310" x2="780" y2="190" stroke="#CC972D" stroke-width="1.2" stroke-opacity="0.28"/>
  <line x1="900" y1="310" x2="1040" y2="200" stroke="#CC972D" stroke-width="1.2" stroke-opacity="0.28"/>
  <line x1="900" y1="310" x2="1060" y2="350" stroke="#CC972D" stroke-width="1.2" stroke-opacity="0.28"/>
  <line x1="900" y1="310" x2="1000" y2="460" stroke="#CC972D" stroke-width="1.2" stroke-opacity="0.28"/>
  <line x1="900" y1="310" x2="760" y2="420" stroke="#CC972D" stroke-width="1.2" stroke-opacity="0.28"/>
  <line x1="900" y1="310" x2="690" y2="290" stroke="#CC972D" stroke-width="1.2" stroke-opacity="0.22"/>
  <!-- Cross connections (secondary) -->
  <line x1="780" y1="190" x2="1040" y2="200" stroke="#CC972D" stroke-width="0.7" stroke-opacity="0.14"/>
  <line x1="1040" y1="200" x2="1060" y2="350" stroke="#CC972D" stroke-width="0.7" stroke-opacity="0.14"/>
  <line x1="1060" y1="350" x2="1000" y2="460" stroke="#CC972D" stroke-width="0.7" stroke-opacity="0.14"/>
  <line x1="1000" y1="460" x2="760" y2="420" stroke="#CC972D" stroke-width="0.7" stroke-opacity="0.14"/>
  <line x1="760" y1="420" x2="780" y2="190" stroke="#CC972D" stroke-width="0.7" stroke-opacity="0.10"/>
  <!-- Tertiary mini nodes -->
  <line x1="780" y1="190" x2="830" y2="130" stroke="#CC972D" stroke-width="0.6" stroke-opacity="0.12"/>
  <line x1="1040" y1="200" x2="1110" y2="160" stroke="#CC972D" stroke-width="0.6" stroke-opacity="0.12"/>
  <line x1="1060" y1="350" x2="1130" y2="390" stroke="#CC972D" stroke-width="0.6" stroke-opacity="0.12"/>
  <line x1="1000" y1="460" x2="960" y2="530" stroke="#CC972D" stroke-width="0.6" stroke-opacity="0.12"/>
  <line x1="760" y1="420" x2="700" y2="490" stroke="#CC972D" stroke-width="0.6" stroke-opacity="0.12"/>

  <!-- Pulse ring on central hub -->
  <circle cx="900" cy="310" r="48" fill="url(#nodeRing)"/>
  <circle cx="900" cy="310" r="34" fill="none" stroke="#CC972D" stroke-width="1" stroke-opacity="0.18"/>

  <!-- Central hub node -->
  <circle cx="900" cy="310" r="22" fill="#06264C" stroke="#CC972D" stroke-width="2.2" stroke-opacity="0.90"/>
  <!-- AI chip icon inside hub: simple grid cross -->
  <line x1="892" y1="310" x2="908" y2="310" stroke="#CC972D" stroke-width="1.8" stroke-opacity="0.95"/>
  <line x1="900" y1="302" x2="900" y2="318" stroke="#CC972D" stroke-width="1.8" stroke-opacity="0.95"/>
  <rect x="895" y="305" width="10" height="10" rx="2" fill="none" stroke="#CC972D" stroke-width="1.2" stroke-opacity="0.70"/>

  <!-- Satellite nodes — primary -->
  <circle cx="780" cy="190" r="14" fill="#071E3D" stroke="#CC972D" stroke-width="1.8" stroke-opacity="0.80"/>
  <circle cx="780" cy="190" r="5"  fill="#CC972D" fill-opacity="0.70"/>

  <circle cx="1040" cy="200" r="14" fill="#071E3D" stroke="#CC972D" stroke-width="1.8" stroke-opacity="0.80"/>
  <circle cx="1040" cy="200" r="5"  fill="#CC972D" fill-opacity="0.70"/>

  <circle cx="1060" cy="350" r="14" fill="#071E3D" stroke="#CC972D" stroke-width="1.8" stroke-opacity="0.80"/>
  <circle cx="1060" cy="350" r="5"  fill="#CC972D" fill-opacity="0.70"/>

  <circle cx="1000" cy="460" r="14" fill="#071E3D" stroke="#CC972D" stroke-width="1.8" stroke-opacity="0.80"/>
  <circle cx="1000" cy="460" r="5"  fill="#CC972D" fill-opacity="0.70"/>

  <circle cx="760" cy="420" r="14" fill="#071E3D" stroke="#CC972D" stroke-width="1.8" stroke-opacity="0.80"/>
  <circle cx="760" cy="420" r="5"  fill="#CC972D" fill-opacity="0.70"/>

  <!-- Small secondary nodes -->
  <circle cx="690" cy="290" r="8" fill="#06264C" stroke="#CC972D" stroke-width="1.4" stroke-opacity="0.55"/>
  <circle cx="830" cy="130" r="8" fill="#06264C" stroke="#CC972D" stroke-width="1.4" stroke-opacity="0.55"/>
  <circle cx="1110" cy="160" r="8" fill="#06264C" stroke="#CC972D" stroke-width="1.4" stroke-opacity="0.55"/>
  <circle cx="1130" cy="390" r="8" fill="#06264C" stroke="#CC972D" stroke-width="1.4" stroke-opacity="0.55"/>
  <circle cx="960"  cy="530" r="8" fill="#06264C" stroke="#CC972D" stroke-width="1.4" stroke-opacity="0.55"/>
  <circle cx="700"  cy="490" r="8" fill="#06264C" stroke="#CC972D" stroke-width="1.4" stroke-opacity="0.55"/>

  <!-- Node labels (small, ghost text) -->
  <text x="770" y="174" font-family="Arial, Helvetica, sans-serif" font-size="10"
        fill="#EFE3D3" opacity="0.38" text-anchor="middle">t&#253;m</text>
  <text x="1045" y="184" font-family="Arial, Helvetica, sans-serif" font-size="10"
        fill="#EFE3D3" opacity="0.38" text-anchor="middle">hosté</text>
  <text x="1072" y="370" font-family="Arial, Helvetica, sans-serif" font-size="10"
        fill="#EFE3D3" opacity="0.38" text-anchor="middle">n&#225;klady</text>
  <text x="1003" y="478" font-family="Arial, Helvetica, sans-serif" font-size="10"
        fill="#EFE3D3" opacity="0.38" text-anchor="middle">marže</text>
  <text x="754" y="438" font-family="Arial, Helvetica, sans-serif" font-size="10"
        fill="#EFE3D3" opacity="0.38" text-anchor="middle">strategie</text>

  <!-- ══════════════════════════════════════════════
       LEFT PANEL: Text content
       ══════════════════════════════════════════════ -->

  <!-- AI badge pill -->
  <rect x="60" y="88" width="298" height="36" rx="18"
        fill="url(#badgeFill)" stroke="#CC972D" stroke-width="1.2" stroke-opacity="0.60"/>
  <!-- Small circuit dot before text -->
  <circle cx="82" cy="106" r="4" fill="#CC972D" fill-opacity="0.90"/>
  <line x1="86" y1="106" x2="94" y2="106" stroke="#CC972D" stroke-width="1.2" stroke-opacity="0.70"/>
  <text x="100" y="112"
        font-family="Arial, Helvetica, sans-serif"
        font-size="14"
        font-weight="700"
        fill="#CC972D"
        letter-spacing="2.5">AI PORADCE PRO GASTRO</text>

  <!-- Main headline line 1: "Gastro Parťák" — cream, serif, large -->
  <text x="60" y="210"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="80"
        font-weight="700"
        fill="#EFE3D3"
        letter-spacing="-2">Gastro Par&#357;&#225;k</text>

  <!-- Main headline line 2: "AI poradce" — gold -->
  <text x="60" y="295"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="64"
        font-weight="700"
        fill="#CC972D"
        letter-spacing="-1.5">AI poradce</text>

  <!-- Main headline line 3: "pro tv&#367;j podnik." — cream, slightly smaller -->
  <text x="60" y="367"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="56"
        font-weight="700"
        fill="#EFE3D3"
        fill-opacity="0.88"
        letter-spacing="-1">pro tv&#367;j podnik.</text>

  <!-- Gold rule separator -->
  <rect x="60" y="392" width="500" height="2" rx="1" fill="url(#goldRule)"/>

  <!-- Subtitle -->
  <text x="60" y="432"
        font-family="Arial, Helvetica, sans-serif"
        font-size="22"
        font-weight="400"
        fill="#EFE3D3"
        opacity="0.72">T&#253;m &#8231; host&#233; &#8231; n&#225;klady &#8231; strategie</text>
  <text x="60" y="462"
        font-family="Arial, Helvetica, sans-serif"
        font-size="19"
        font-weight="400"
        fill="#EFE3D3"
        opacity="0.52">Postaveno na 20 letech gastro praxe.</text>

  <!-- Bottom bar: domain + tagline -->
  <rect x="0" y="${H - 68}" width="${W}" height="68" fill="#020F1F" fill-opacity="0.55"/>
  <text x="60" y="${H - 26}"
        font-family="Arial, Helvetica, sans-serif"
        font-size="22"
        font-weight="700"
        fill="#CC972D"
        letter-spacing="0.5">gastroup.cz</text>
  <text x="${W - 60}" y="${H - 26}"
        font-family="Arial, Helvetica, sans-serif"
        font-size="16"
        font-weight="400"
        fill="#EFE3D3"
        opacity="0.45"
        text-anchor="end">Tv&#367;j partn&#233;r v kapse</text>
</svg>`);

  // Resize the full logo — place it top-left inside left panel, above the badge
  // Logo is 957×311 — scale to ~300px wide keeping ratio (≈ 98px tall)
  const LOGO_W = 300;
  const LOGO_H = Math.round(311 * (LOGO_W / 957)); // ≈ 97

  const logoResized = await sharp(LOGO_FULL)
    .resize(LOGO_W, LOGO_H, { fit: 'contain', background: { r:0,g:0,b:0,alpha:0 } })
    .png()
    .toBuffer();

  // Position logo: top-left of left panel, generous top margin
  const logoLeft = 56;
  const logoTop  = 22;

  // Boost logo brightness slightly so it pops on navy bg
  const logoBoosted = await sharp(logoResized)
    .modulate({ brightness: 1.18, saturation: 1.05 })
    .png()
    .toBuffer();

  const result = await sharp({
    create: { width: W, height: H, channels: 4, background: { r:0,g:0,b:0,alpha:255 } }
  })
  .composite([
    { input: bgSvg,       top: 0,       left: 0        },
    { input: logoBoosted, top: logoTop, left: logoLeft  }
  ])
  .png({ compressionLevel: 9, palette: false })
  .toFile(path.join(ROOT, 'og-image.png'));

  const stat = fs.statSync(path.join(ROOT, 'og-image.png'));
  console.log(`  og-image.png  → ${result.width}×${result.height}  ${(stat.size/1024).toFixed(1)} KB`);
  if (stat.size > 200 * 1024) {
    console.warn('  WARNING: og-image.png exceeds 200 KB — attempting recompression...');
    // Fallback: palette quantization to temp file, then rename
    const tmpPath = path.join(ROOT, 'og-image.tmp.png');
    await sharp(path.join(ROOT, 'og-image.png'))
      .png({ compressionLevel: 9, palette: true, colors: 192 })
      .toFile(tmpPath);
    fs.renameSync(tmpPath, path.join(ROOT, 'og-image.png'));
    const stat2 = fs.statSync(path.join(ROOT, 'og-image.png'));
    console.log(`  og-image.png  recompressed → ${(stat2.size/1024).toFixed(1)} KB`);
  }
  return result;
}

// ─── 2. Square icon: navy bg + centered logomark ──────────────────────────────
async function makeSquareIcon(size, outFile, transparent = false) {
  console.log(`  Building ${path.basename(outFile)} (${size}×${size})...`);

  const padding  = Math.round(size * 0.12); // 12% padding on each side
  const inner    = size - padding * 2;

  const logoResized = await sharp(LOGO_MARK)
    .resize(inner, inner, { fit: 'contain', background: { r:0,g:0,b:0,alpha:0 } })
    .png()
    .toBuffer();

  let base;
  if (transparent) {
    // Transparent background (for favicon-512/192)
    base = sharp({
      create: { width: size, height: size, channels: 4,
                background: { r: NAVY.r, g: NAVY.g, b: NAVY.b, alpha: 255 } }
    });
  } else {
    // Solid navy (for apple-touch-icon)
    base = sharp({
      create: { width: size, height: size, channels: 3,
                background: NAVY }
    });
  }

  const result = await base
    .composite([{ input: logoResized, top: padding, left: padding }])
    .png({ compressionLevel: 9 })
    .toFile(outFile);

  const stat = fs.statSync(outFile);
  console.log(`  ${path.basename(outFile)}  → ${result.width}×${result.height}  ${(stat.size/1024).toFixed(1)} KB`);
  return result;
}

// ─── 3. favicon.ico (16, 32, 48 layers) ──────────────────────────────────────
async function makeFaviconIco() {
  console.log('  Building favicon.ico (16/32/48 layers via png-to-ico)...');

  const sizes  = [16, 32, 48];
  const buffers = [];

  for (const sz of sizes) {
    const padding = Math.round(sz * 0.12);
    const inner   = sz - padding * 2;

    const logoResized = await sharp(LOGO_MARK)
      .resize(inner, inner, { fit: 'contain', background: { r:0,g:0,b:0,alpha:0 } })
      .png()
      .toBuffer();

    const buf = await sharp({
      create: { width: sz, height: sz, channels: 4,
                background: { r: NAVY.r, g: NAVY.g, b: NAVY.b, alpha: 255 } }
    })
    .composite([{ input: logoResized, top: padding, left: padding }])
    .png()
    .toBuffer();

    buffers.push(buf);
  }

  // Encode multi-res ICO
  const icoBuffer = await pngToIco(buffers);
  const outPath   = path.join(ROOT, 'favicon.ico');
  fs.writeFileSync(outPath, icoBuffer);

  const stat = fs.statSync(outPath);
  console.log(`  favicon.ico  → multi-res (16/32/48)  ${(stat.size/1024).toFixed(1)} KB`);

  // Quick sanity: ICO files start with 0x00 0x00 0x01 0x00
  const magic = icoBuffer.slice(0, 4);
  const valid = magic[0] === 0 && magic[1] === 0 && magic[2] === 1 && magic[3] === 0;
  console.log(`  favicon.ico valid ICO magic: ${valid}`);
  return stat;
}

// ─── Verification ─────────────────────────────────────────────────────────────
async function verify() {
  console.log('\n── Verification ──────────────────────────────────────────────');
  const files = [
    { name: 'og-image.png',          w: 1200, h: 630, maxKB: 200 },
    { name: 'favicon-512.png',       w: 512,  h: 512             },
    { name: 'favicon-192.png',       w: 192,  h: 192             },
    { name: 'apple-touch-icon.png',  w: 180,  h: 180             },
    { name: 'favicon.ico',           w: null, h: null             },
  ];
  let allOk = true;
  for (const f of files) {
    const fp = path.join(ROOT, f.name);
    if (!fs.existsSync(fp)) { console.error(`  MISSING: ${f.name}`); allOk=false; continue; }
    const stat = fs.statSync(fp);
    if (f.name.endsWith('.ico')) {
      const buf = fs.readFileSync(fp);
      const valid = buf[0]===0 && buf[1]===0 && buf[2]===1 && buf[3]===0;
      console.log(`  ${f.name.padEnd(24)} ${(stat.size/1024).toFixed(1).padStart(7)} KB  ICO-magic:${valid ? 'OK' : 'FAIL'}`);
      if (!valid) allOk=false;
    } else {
      const meta = await sharp(fp).metadata();
      const dimOk = (f.w ? meta.width === f.w : true) && (f.h ? meta.height === f.h : true);
      const sizeOk = f.maxKB ? stat.size <= f.maxKB*1024 : true;
      const flag = dimOk && sizeOk ? 'OK' : 'FAIL';
      console.log(`  ${f.name.padEnd(24)} ${(stat.size/1024).toFixed(1).padStart(7)} KB  ${meta.width}×${meta.height}  [${flag}]`);
      if (!dimOk) { console.error(`    ^ expected ${f.w}×${f.h}`); allOk=false; }
      if (!sizeOk){ console.error(`    ^ exceeds ${f.maxKB} KB`);  allOk=false; }
    }
  }
  console.log(`\n  Overall: ${allOk ? 'ALL PASS' : 'SOME FAILURES'}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  console.log('GastroUp brand asset generation\n');
  try {
    await makeOgImage();
    await makeSquareIcon(512, path.join(ROOT, 'favicon-512.png'),      true);
    await makeSquareIcon(192, path.join(ROOT, 'favicon-192.png'),      true);
    await makeSquareIcon(180, path.join(ROOT, 'apple-touch-icon.png'), false);
    await makeFaviconIco();
    await verify();
    console.log('\nDone.\n');
  } catch (err) {
    console.error('\nError:', err);
    process.exit(1);
  }
})();
