/**
 * Build-time partials assembler.
 *
 * Directive (anywhere in a line, inside any src/ file):
 *   <!-- @include path/relative/to/src -->
 *   <!-- @include path key="value" key2='value with "quotes"' -->
 *
 * The directive token is replaced by the partial's content with exactly one
 * trailing newline stripped (the directive's own line keeps its newline, so a
 * whole-line include reproduces the partial byte-for-byte, while an inline
 * include drops cleanly into the surrounding markup).
 *
 * Included files may contain {{key}} placeholders which are substituted with
 * the parameter values passed at the include site. A missing parameter is an
 * error (fail-fast — a typo must never reach production HTML).
 *
 * Includes resolve recursively (max depth 10). All paths are relative to src/.
 */
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');
const MAX_DEPTH = 10;

const INCLUDE_RE = /<!-- @include (\S+)((?: [\w-]+=(?:"[^"]*"|'[^']*'))*) -->/g;
const ATTR_RE = / ([\w-]+)=(?:"([^"]*)"|'([^']*)')/g;

function substituteParams(text, params, fileLabel) {
  return text.replace(/\{\{([\w-]+)\}\}/g, (m, key) => {
    if (params == null || !(key in params)) {
      throw new Error(`Missing parameter {{${key}}} for partial ${fileLabel}`);
    }
    return params[key];
  });
}

function assemble(relPath, params = {}, chain = []) {
  if (chain.includes(relPath)) {
    throw new Error(`Circular include: ${[...chain, relPath].join(' -> ')}`);
  }
  if (chain.length > MAX_DEPTH) {
    throw new Error(`Include depth exceeded: ${[...chain, relPath].join(' -> ')}`);
  }
  const abs = path.join(SRC_DIR, relPath);
  // Guard against directives escaping src/ (e.g. ../../ paths)
  if (!path.resolve(abs).startsWith(path.resolve(SRC_DIR) + path.sep)) {
    throw new Error(`Include path escapes src/: ${relPath} (in ${chain.join(' -> ') || 'page root'})`);
  }
  if (!fs.existsSync(abs)) {
    throw new Error(`Partial not found: src/${relPath} (included from ${chain.join(' -> ') || 'page root'})`);
  }
  let text = fs.readFileSync(abs, 'utf8');
  text = substituteParams(text, params, `src/${relPath}`);

  const out = text.replace(INCLUDE_RE, (full, incPath, attrStr) => {
    const incParams = {};
    let m;
    ATTR_RE.lastIndex = 0;
    while ((m = ATTR_RE.exec(attrStr)) !== null) {
      incParams[m[1]] = m[2] !== undefined ? m[2] : m[3];
    }
    // Strip exactly one trailing newline — the include site's own line
    // terminator survives, so whole-line includes stay byte-exact and inline
    // includes don't break the surrounding line.
    return assemble(incPath, incParams, [...chain, relPath]).replace(/\r?\n$/, '');
  });

  // Fail-fast on malformed directives: anything mentioning @include that did
  // not match INCLUDE_RE would otherwise survive as an HTML comment and be
  // silently deleted by the minifier — shipping a page with a missing block.
  if (/<!--\s*@include\b/.test(out)) {
    const line = out.split('\n').find((l) => /<!--\s*@include\b/.test(l));
    throw new Error(`Malformed @include directive in src/${relPath} (check spacing/quoting): ${line.trim().slice(0, 120)}`);
  }
  return out;
}

module.exports = { assemble, SRC_DIR };
