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

  // ── Layout constants ────────────────────────────────────────────────────────
  // WhatsApp square-crop safe zone: x=285..915 (630px wide), full height.
  // ALL key content is centered horizontally and lives within that band.
  //
  // Logo: 957×311 original → scaled to 560px wide → 182px tall
  //   left = (1200-560)/2 = 320   right = 880   (both inside safe zone)
  //   top  = 108   bottom = 108+182 = 290
  //
  // Tagline "AI parťák pro majitele restaurací": navy bold, centered, y≈368
  // Gold divider: centered 360px wide, y≈410
  // Domain "gastroup.cz": gold centered, y≈460
  // Subtitle "Tým • hosté • náklady • strategie": navy muted, centered, y≈498

  const LOGO_TARGET_W = 560;
  const LOGO_ORIG_W   = 957;
  const LOGO_ORIG_H   = 311;
  const LOGO_TARGET_H = Math.round(LOGO_ORIG_H * (LOGO_TARGET_W / LOGO_ORIG_W)); // 182
  const LOGO_LEFT     = Math.round((W - LOGO_TARGET_W) / 2);  // 320
  const LOGO_TOP      = 90;

  // SVG layer: cream background + all text (no logo — composited separately)
  const bgSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <!-- Very subtle warm vignette to lift center -->
    <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
      <stop offset="0%"   stop-color="#FFFFFF" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.05"/>
    </radialGradient>
    <!-- Gold divider fade -->
    <linearGradient id="goldFade" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   stop-color="#CC972D" stop-opacity="0"/>
      <stop offset="15%"  stop-color="#CC972D" stop-opacity="1"/>
      <stop offset="85%"  stop-color="#CC972D" stop-opacity="1"/>
      <stop offset="100%" stop-color="#CC972D" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <!-- ── Cream background ── -->
  <rect width="${W}" height="${H}" fill="#EFE3D3"/>
  <!-- Subtle warm vignette for depth -->
  <rect width="${W}" height="${H}" fill="url(#vignette)"/>

  <!-- ── Very faint brand pattern: corner accents (outside safe zone) ── -->
  <!-- Top-left corner bracket -->
  <line x1="40"  y1="40"  x2="160" y2="40"  stroke="#CC972D" stroke-width="1.5" stroke-opacity="0.18"/>
  <line x1="40"  y1="40"  x2="40"  y2="140" stroke="#CC972D" stroke-width="1.5" stroke-opacity="0.18"/>
  <!-- Top-right corner bracket -->
  <line x1="1160" y1="40"  x2="1040" y2="40"  stroke="#CC972D" stroke-width="1.5" stroke-opacity="0.18"/>
  <line x1="1160" y1="40"  x2="1160" y2="140" stroke="#CC972D" stroke-width="1.5" stroke-opacity="0.18"/>
  <!-- Bottom-left corner bracket -->
  <line x1="40"  y1="590" x2="160" y2="590" stroke="#CC972D" stroke-width="1.5" stroke-opacity="0.18"/>
  <line x1="40"  y1="590" x2="40"  y2="490" stroke="#CC972D" stroke-width="1.5" stroke-opacity="0.18"/>
  <!-- Bottom-right corner bracket -->
  <line x1="1160" y1="590" x2="1040" y2="590" stroke="#CC972D" stroke-width="1.5" stroke-opacity="0.18"/>
  <line x1="1160" y1="590" x2="1160" y2="490" stroke="#CC972D" stroke-width="1.5" stroke-opacity="0.18"/>

  <!-- ── Tagline: "AI parťák pro majitele restaurací" ──
       Centered at x=600, baseline y=375
       font-size 44, bold, navy #06264C
       Using HTML entities for Czech: ť=&#357; á=&#225; í=&#237;
  -->
  <text x="600" y="375"
        font-family="Georgia, Arial, Helvetica, sans-serif"
        font-size="44"
        font-weight="700"
        fill="#06264C"
        text-anchor="middle"
        letter-spacing="0.3">AI par&#357;&#225;k pro majitele restaurac&#237;</text>

  <!-- ── Gold divider: 360px wide, centered ── -->
  <!-- divider left = (1200-360)/2 = 420, right = 780 -->
  <rect x="420" y="408" width="360" height="2" rx="1" fill="url(#goldFade)"/>

  <!-- ── Domain "gastroup.cz" centered in gold ── -->
  <text x="600" y="457"
        font-family="Arial, Helvetica, sans-serif"
        font-size="24"
        font-weight="700"
        fill="#CC972D"
        text-anchor="middle"
        letter-spacing="1.2">gastroup.cz</text>

  <!-- ── Subtitle: "Tým • hosté • náklady • strategie" — navy muted ── -->
  <text x="600" y="497"
        font-family="Arial, Helvetica, sans-serif"
        font-size="18"
        font-weight="400"
        fill="#06264C"
        fill-opacity="0.45"
        text-anchor="middle"
        letter-spacing="0.5">T&#253;m &#8226; host&#233; &#8226; n&#225;klady &#8226; strategie</text>
</svg>`);

  // ── Resize the hero logo ─────────────────────────────────────────────────────
  // Logo has a transparent background — keep as-is on cream, no brightness boost needed.
  const logoResized = await sharp(LOGO_FULL)
    .resize(LOGO_TARGET_W, LOGO_TARGET_H, { fit: 'contain', background: { r:0,g:0,b:0,alpha:0 } })
    .png()
    .toBuffer();

  const result = await sharp({
    create: { width: W, height: H, channels: 4, background: { r: 239, g: 227, b: 211, alpha: 255 } }
  })
  .composite([
    { input: bgSvg,      top: 0,        left: 0         },
    { input: logoResized, top: LOGO_TOP, left: LOGO_LEFT }
  ])
  .png({ compressionLevel: 9, palette: false })
  .toFile(path.join(ROOT, 'og-image.png'));

  const stat = fs.statSync(path.join(ROOT, 'og-image.png'));
  console.log(`  og-image.png  → ${result.width}×${result.height}  ${(stat.size/1024).toFixed(1)} KB`);
  console.log(`  Logo: ${LOGO_TARGET_W}×${LOGO_TARGET_H}px  left=${LOGO_LEFT}  top=${LOGO_TOP}`);
  if (stat.size > 200 * 1024) {
    console.warn('  WARNING: og-image.png exceeds 200 KB — attempting recompression...');
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
