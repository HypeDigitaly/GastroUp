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

  // ---------- background: navy gradient simulation via SVG rect + overlay ----
  const bgSvg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <!-- Main navy background -->
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#06264C"/>
      <stop offset="50%"  stop-color="#0E3A6D"/>
      <stop offset="100%" stop-color="#03152E"/>
    </linearGradient>
    <!-- Subtle radial glow top-left -->
    <radialGradient id="glow" cx="18%" cy="25%" r="55%">
      <stop offset="0%"   stop-color="#0E3A6D" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#06264C" stop-opacity="0"/>
    </radialGradient>
    <!-- Gold accent line gradient -->
    <linearGradient id="goldLine" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   stop-color="#CC972D" stop-opacity="0"/>
      <stop offset="15%"  stop-color="#CC972D" stop-opacity="1"/>
      <stop offset="85%"  stop-color="#E5AE3D" stop-opacity="1"/>
      <stop offset="100%" stop-color="#CC972D" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>

  <!-- Decorative gold arc top-right -->
  <path d="M 1080 -40 Q 1350 200 1100 480" stroke="#CC972D" stroke-width="1.5"
        stroke-opacity="0.22" fill="none"/>
  <path d="M 1020 -60 Q 1320 220 1060 520" stroke="#CC972D" stroke-width="1"
        stroke-opacity="0.12" fill="none"/>

  <!-- Gold horizontal rule above text -->
  <rect x="60" y="358" width="560" height="2.5" rx="1.25" fill="url(#goldLine)"/>

  <!-- Headline: Přestaň táhnout celý podnik sám. -->
  <text x="60" y="310"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="72"
        font-weight="700"
        fill="#EFE3D3"
        letter-spacing="-1.5">P&#345;esta&#328; t&#225;hnout</text>
  <text x="60" y="352"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="72"
        font-weight="700"
        fill="#CC972D"
        letter-spacing="-1.5">cel&#253; podnik s&#225;m.</text>

  <!-- Subtitle -->
  <text x="61" y="410"
        font-family="Arial, Helvetica, sans-serif"
        font-size="28"
        font-weight="400"
        fill="#EFE3D3"
        opacity="0.80">Gastro Part&#225;k &#8212; poradce v telefonu</text>

  <!-- Bottom domain hint -->
  <text x="61" y="${H - 36}"
        font-family="Arial, Helvetica, sans-serif"
        font-size="20"
        font-weight="400"
        fill="#CC972D"
        opacity="0.70">gastroup.cz</text>
</svg>`);

  // Resize the full logo to fit on the right side
  // Logo is 957×311 — scale to ~480px wide keeping ratio
  const LOGO_W = 480;
  const LOGO_H = Math.round(311 * (LOGO_W / 957)); // ≈ 156

  const logoResized = await sharp(LOGO_FULL)
    .resize(LOGO_W, LOGO_H, { fit: 'contain', background: { r:0,g:0,b:0,alpha:0 } })
    .png()
    .toBuffer();

  // Position logo: right side, vertically centered in upper half
  const logoLeft = W - LOGO_W - 80;   // 80px from right edge
  const logoTop  = Math.round((H / 2 - LOGO_H) / 2) + 30; // ~110px from top

  // Boost logo brightness slightly so it pops on navy bg
  const logoBoosted = await sharp(logoResized)
    .modulate({ brightness: 1.15, saturation: 1.1 })
    .png()
    .toBuffer();

  const result = await sharp({
    create: { width: W, height: H, channels: 4, background: { r:0,g:0,b:0,alpha:255 } }
  })
  .composite([
    { input: bgSvg,       top: 0, left: 0 },
    { input: logoBoosted, top: logoTop, left: logoLeft }
  ])
  .png({ compressionLevel: 9, palette: false })
  .toFile(path.join(ROOT, 'og-image.png'));

  const stat = fs.statSync(path.join(ROOT, 'og-image.png'));
  console.log(`  og-image.png  → ${result.width}×${result.height}  ${(stat.size/1024).toFixed(1)} KB`);
  if (stat.size > 200 * 1024) {
    console.warn('  WARNING: og-image.png exceeds 200 KB — attempting recompression...');
    // Fallback: reduce colors with palette quantization
    await sharp(path.join(ROOT, 'og-image.png'))
      .png({ compressionLevel: 9, palette: true, colors: 128 })
      .toFile(path.join(ROOT, 'og-image.png'));
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
