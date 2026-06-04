const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { minify } = require('html-minifier-terser');
const { assemble } = require('./scripts/assemble.js');

const DIST_DIR = path.join(__dirname, 'dist');
// Pages are assembled from src/ partials (see scripts/assemble.js):
// src/pages/*.html templates pull in src/components, src/sections, src/styles, src/js.
const PAGES = [
  'index.html',
  'obchodni-podminky.html',
  'ochrana-osobnich-udaju.html',
  '404.html'
];
const SOURCE_IMAGES = [
  'Logo_GastroUp_2_transparent.png',
  'Zakladatel_Jakub_Hnat.png',
  'Ebook_Image.jpeg'
];
const COPY_FILES = [
  'og-image.png',
  'favicon.ico',
  'favicon-192.png',
  'favicon-512.png',
  'apple-touch-icon.png',
  'robots.txt',
  'sitemap.xml',
  'llms.txt',
  'site.webmanifest'
];
const minifyOptions = {
  collapseWhitespace: true,
  removeComments: true,
  minifyJS: true,
  minifyCSS: true,
  removeRedundantAttributes: true,
  keepClosingSlash: false
};

(async () => {
  try {
    // Clean and recreate dist directory
    if (fs.existsSync(DIST_DIR)) {
      fs.rmSync(DIST_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(DIST_DIR, { recursive: true });

    console.log('🔨 Starting build process...\n');

    // ============ Step 1: Assemble pages from src/ partials + minify ============
    let originalSize = 0;
    let minifiedSize = 0;
    for (const page of PAGES) {
      const assembledHTML = assemble(`pages/${page}`);
      const pageOriginalSize = Buffer.byteLength(assembledHTML, 'utf8');

      console.log(`📄 Assembling + minifying ${page} (${pageOriginalSize} bytes)...`);
      const minifiedHTML = await minify(assembledHTML, minifyOptions);
      const pageMinifiedSize = Buffer.byteLength(minifiedHTML, 'utf8');

      // ── Integrity gates: a page must never ship with an unresolved
      //    directive/placeholder or a missing critical block ──
      assertPage(page, !/<!--\s*@include\b/.test(minifiedHTML), 'unresolved @include directive leaked into output');
      assertPage(page, !/\{\{[\w-]+\}\}/.test(minifiedHTML), 'unresolved {{param}} placeholder leaked into output');
      assertPage(page, minifiedHTML.includes('</html>'), 'output truncated (missing </html>)');
      assertPage(page, minifiedHTML.includes('gp-cookie-banner'), 'cookie consent banner missing');
      assertPage(page, minifiedHTML.includes('googletagmanager.com/gtag/js'), 'GA/consent snippet missing');

      fs.writeFileSync(path.join(DIST_DIR, page), minifiedHTML, 'utf8');
      console.log(`   ✓ Minified: ${pageMinifiedSize} bytes (saved ${pageOriginalSize - pageMinifiedSize} bytes, ${Math.round((1 - pageMinifiedSize / pageOriginalSize) * 100)}%)\n`);

      originalSize += pageOriginalSize;
      minifiedSize += pageMinifiedSize;
    }

    // ============ Step 2: Process images with sharp ============
    for (const imageName of SOURCE_IMAGES) {
      const imagePath = path.join(__dirname, imageName);
      if (!fs.existsSync(imagePath)) {
        console.error(`ERROR: Required image not found: ${imageName}`);
        process.exit(1);
      }

      const parsed = path.parse(imageName);
      const baseName = parsed.name;
      const ext = parsed.ext.toLowerCase();
      console.log(`🖼️  Processing ${imageName}...`);

      // Copy/optimize original image
      const destOrig = path.join(DIST_DIR, imageName);
      let origSize;

      if (ext === '.jpeg' || ext === '.jpg') {
        // Re-encode JPEG with optimization
        await sharp(imagePath).jpeg({ quality: 80, mozjpeg: true }).toFile(destOrig);
        origSize = fs.statSync(destOrig).size;
        console.log(`   ✓ Optimized original JPEG: ${origSize} bytes`);
      } else {
        // Copy original PNG as-is
        fs.copyFileSync(imagePath, destOrig);
        origSize = fs.statSync(destOrig).size;
        console.log(`   ✓ Copied original: ${origSize} bytes`);
      }

      // Generate WebP
      const destWebp = path.join(DIST_DIR, `${baseName}.webp`);
      await sharp(imagePath).webp({ quality: 82 }).toFile(destWebp);
      const webpSize = fs.statSync(destWebp).size;
      console.log(`   ✓ Generated WebP: ${webpSize} bytes (saved ${origSize - webpSize} bytes)`);

      // Generate AVIF
      const destAvif = path.join(DIST_DIR, `${baseName}.avif`);
      await sharp(imagePath).avif({ quality: 55 }).toFile(destAvif);
      const avifSize = fs.statSync(destAvif).size;
      console.log(`   ✓ Generated AVIF: ${avifSize} bytes (saved ${origSize - avifSize} bytes)\n`);
    }

    // ============ Step 3: Copy curated files ============
    console.log('📋 Copying curated files...');
    const missingFiles = [];

    for (const file of COPY_FILES) {
      const srcPath = path.join(__dirname, file);
      if (fs.existsSync(srcPath)) {
        const destPath = path.join(DIST_DIR, file);
        fs.copyFileSync(srcPath, destPath);
        const fileSize = fs.statSync(destPath).size;
        console.log(`   ✓ ${file} (${fileSize} bytes)`);
      } else {
        missingFiles.push(file);
      }
    }

    if (missingFiles.length > 0) {
      console.log(`\n⚠️  WARNING: The following files were not found in source (may be generated by parallel tasks):`);
      missingFiles.forEach(f => console.log(`   - ${f}`));
    }

    // Copy fonts directory if it exists
    const fontsDir = path.join(__dirname, 'fonts');
    if (fs.existsSync(fontsDir)) {
      const destFontsDir = path.join(DIST_DIR, 'fonts');
      fs.mkdirSync(destFontsDir, { recursive: true });
      const fontsFiles = fs.readdirSync(fontsDir);
      for (const file of fontsFiles) {
        const srcFile = path.join(fontsDir, file);
        const destFile = path.join(destFontsDir, file);
        if (fs.statSync(srcFile).isFile()) {
          fs.copyFileSync(srcFile, destFile);
          console.log(`   ✓ fonts/${file}`);
        }
      }
    }

    // Copy ebook directory if it exists
    const ebookDir = path.join(__dirname, 'ebook');
    if (fs.existsSync(ebookDir)) {
      const destEbookDir = path.join(DIST_DIR, 'ebook');
      fs.mkdirSync(destEbookDir, { recursive: true });
      const ebookFiles = fs.readdirSync(ebookDir);
      for (const file of ebookFiles) {
        const srcFile = path.join(ebookDir, file);
        const destFile = path.join(destEbookDir, file);
        if (fs.statSync(srcFile).isFile()) {
          fs.copyFileSync(srcFile, destFile);
          console.log(`   ✓ ebook/${file}`);
        }
      }
    }

    console.log('\n✅ Build complete!\n');

    // ============ Summary ============
    const distFiles = getAllFiles(DIST_DIR);
    const distSize = distFiles.reduce((sum, file) => sum + fs.statSync(file).size, 0);
    console.log('📊 Build Summary:');
    console.log(`   Files written: ${distFiles.length}`);
    console.log(`   Total dist size: ${distSize} bytes (${(distSize / 1024).toFixed(2)} KB)`);
    console.log(`   HTML minification: ${Math.round((1 - minifiedSize / originalSize) * 100)}% reduction`);

  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
})();

function assertPage(page, condition, message) {
  if (!condition) {
    throw new Error(`Integrity check failed for ${page}: ${message}`);
  }
}

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });
  return arrayOfFiles;
}
