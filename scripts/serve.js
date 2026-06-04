/**
 * Tiny local preview server for dist/ — used by start-web.bat.
 * Serves the built site with the same clean-URL + 404 behavior as Netlify.
 * (Static preview only — form submissions need `npm run dev` / Netlify Functions.)
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist');
const PORT = process.env.PORT || 8765;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif',
  '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.xml': 'application/xml', '.txt': 'text/plain',
  '.webmanifest': 'application/manifest+json', '.pdf': 'application/pdf',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.md': 'text/markdown'
};

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error('dist/index.html not found — run "npm run build" first.');
  process.exit(1);
}

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  let file = path.join(DIST, p);
  // clean URLs: /obchodni-podminky -> obchodni-podminky.html
  if (!fs.existsSync(file) && fs.existsSync(file + '.html')) file = file + '.html';
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    file = path.join(DIST, '404.html');
    res.statusCode = 404;
  }
  res.setHeader('Content-Type', MIME[path.extname(file).toLowerCase()] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
}).listen(PORT, '127.0.0.1', () => {
  console.log('');
  console.log('  ✅ GastroUp running at:  http://localhost:' + PORT);
  console.log('');
  console.log('  Note: form submissions need Netlify Functions — use "npm run dev" for that.');
  console.log('  Close this window to stop the server.');
});
