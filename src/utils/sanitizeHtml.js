const ALLOWED_TAGS = new Set([
  'a', 'b', 'blockquote', 'br', 'code', 'div', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'hr', 'i', 'img', 'li', 'ol', 'p', 'pre', 's', 'small', 'span', 'strong', 'sub', 'sup',
  'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'u', 'ul',
  'svg', 'path', 'rect', 'circle', 'g', 'defs', 'clippath', 'line', 'polyline', 'polygon',
]);

const VOID_TAGS = new Set(['br', 'hr', 'img', 'path', 'rect', 'circle', 'line', 'polyline', 'polygon']);

const DROP_CONTENT_TAGS = [
  'script', 'style', 'iframe', 'object', 'embed', 'applet', 'form', 'input', 'button',
  'textarea', 'select', 'option', 'meta', 'link', 'base', 'noscript', 'template',
  'foreignobject', 'animate', 'set', 'animatetransform', 'animatemotion', 'audio', 'video',
];

const GLOBAL_ALLOWED_ATTRS = new Set(['class', 'id', 'title', 'role', 'dir', 'lang', 'align', 'valign', 'width', 'height', 'colspan', 'rowspan']);
const TAG_ALLOWED_ATTRS = {
  a: new Set(['href', 'target', 'rel']),
  img: new Set(['src', 'alt', 'width', 'height', 'loading']),
  svg: new Set(['xmlns', 'viewbox', 'width', 'height', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'preserveaspectratio', 'shape-rendering']),
  path: new Set(['d', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'fill-rule', 'clip-rule', 'transform']),
  rect: new Set(['x', 'y', 'width', 'height', 'rx', 'ry', 'fill', 'stroke', 'stroke-width', 'transform']),
  circle: new Set(['cx', 'cy', 'r', 'fill', 'stroke', 'stroke-width', 'transform']),
  g: new Set(['fill', 'stroke', 'stroke-width', 'transform', 'clip-path']),
  clippath: new Set(['id']),
  line: new Set(['x1', 'y1', 'x2', 'y2', 'stroke', 'stroke-width']),
  polyline: new Set(['points', 'fill', 'stroke', 'stroke-width']),
  polygon: new Set(['points', 'fill', 'stroke', 'stroke-width']),
};

function decodeHtmlEntities(value) {
  return value
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex) => {
      const code = parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    })
    .replace(/&#([0-9]+);?/g, (_, dec) => {
      const code = parseInt(dec, 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    })
    .replace(/&colon;/gi, ':')
    .replace(/&tab;/gi, '\t')
    .replace(/&newline;/gi, '\n');
}

function isSafeUrlValue(rawValue, attrName) {
  const decoded = decodeHtmlEntities(rawValue).replace(/[\u0000-\u0020]+/g, '').toLowerCase();
  if (!decoded) return true;
  if (decoded.startsWith('#') || decoded.startsWith('/') || decoded.startsWith('./') || decoded.startsWith('../')) {
    return !decoded.startsWith('//');
  }
  if (attrName === 'src' && /^data:image\/(png|jpeg|jpg|gif|webp);base64,[a-z0-9+/=\s]+$/i.test(decoded)) {
    return true;
  }
  return (
    decoded.startsWith('https://') ||
    decoded.startsWith('http://') ||
    decoded.startsWith('mailto:') ||
    decoded.startsWith('tel:')
  );
}

function sanitizeStyleValue(rawStyle) {
  const decoded = decodeHtmlEntities(rawStyle);
  if (/expression\s*\(|url\s*\(|javascript\s*:|vbscript\s*:|-moz-binding|behavior\s*:|@import/i.test(decoded)) {
    return '';
  }
  return rawStyle.replace(/"/g, '&quot;').trim();
}

function escapeAttr(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function sanitizeAttributes(tag, rawAttrs) {
  if (!rawAttrs || !rawAttrs.trim()) return '';
  const tagSpecific = TAG_ALLOWED_ATTRS[tag];
  const attrRegex = /([a-zA-Z0-9_:-]+)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  const sanitizedParts = [];
  let hasTargetBlank = false;
  let hasRel = false;

  let match;
  while ((match = attrRegex.exec(rawAttrs)) !== null) {
    const rawName = match[1];
    const attrName = rawName.toLowerCase();
    const rawVal = match[2] ?? match[3] ?? match[4] ?? '';

    if (attrName.startsWith('on') || attrName === 'srcdoc' || attrName === 'formaction' || attrName === 'xlink:href') {
      continue;
    }

    if (attrName === 'style') {
      const cleanStyle = sanitizeStyleValue(rawVal);
      if (cleanStyle) {
        sanitizedParts.push(`style="${cleanStyle}"`);
      }
      continue;
    }

    const isAllowed =
      GLOBAL_ALLOWED_ATTRS.has(attrName) ||
      Boolean(tagSpecific && tagSpecific.has(attrName)) ||
      (attrName.startsWith('aria-') && /^[a-z0-9-]+$/.test(attrName));

    if (!isAllowed) continue;

    if (attrName === 'href' || attrName === 'src') {
      if (!isSafeUrlValue(rawVal, attrName)) continue;
    }

    if (attrName === 'clip-path' && !/^url\(#[-a-zA-Z0-9_]+\)$/.test(rawVal.trim())) {
      continue;
    }

    if (tag === 'a' && attrName === 'target' && rawVal.toLowerCase() === '_blank') {
      hasTargetBlank = true;
    }
    if (tag === 'a' && attrName === 'rel') {
      hasRel = true;
      sanitizedParts.push(`rel="noopener noreferrer"`);
      continue;
    }

    const canonicalName = attrName === 'viewbox' ? 'viewBox' : attrName === 'preserveaspectratio' ? 'preserveAspectRatio' : attrName === 'clippath' ? 'clipPath' : attrName;
    sanitizedParts.push(`${canonicalName}="${escapeAttr(rawVal)}"`);
  }

  if (tag === 'a' && hasTargetBlank && !hasRel) {
    sanitizedParts.push('rel="noopener noreferrer"');
  }

  return sanitizedParts.length > 0 ? ` ${sanitizedParts.join(' ')}` : '';
}

/**
 * Strict allowlist-based HTML/SVG sanitizer for rich text notes and email previews.
 */
export function sanitizeHtml(dirty) {
  if (!dirty || typeof dirty !== 'string') return '';
  let clean = dirty;

  clean = clean.replace(/<!--[\s\S]*?-->/g, '');

  let prev = '';
  let passes = 0;
  while (clean !== prev && passes < 3) {
    prev = clean;
    passes++;
    clean = clean.replace(/<(?:\/?[a-zA-Z][a-zA-Z0-9:-]*|!)[^>]*?(?=<|$)/gi, '');
    for (const dropTag of DROP_CONTENT_TAGS) {
      const pairRegex = new RegExp(`<${dropTag}\\b[^>]*>[\\s\\S]*?<\\/${dropTag}\\s*>`, 'gi');
      const singleRegex = new RegExp(`<\\/?${dropTag}\\b[^>]*\\/?>`, 'gi');
      clean = clean.replace(pairRegex, '');
      clean = clean.replace(singleRegex, '');
    }
  }

  clean = clean.replace(/<(\/?)([a-zA-Z0-9:-]+)([^>]*)>/g, (_full, slash, rawTagName, rawAttrs) => {
    const tag = rawTagName.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) {
      return '';
    }
    const canonicalTag = tag === 'clippath' ? 'clipPath' : tag;
    if (slash === '/') {
      return VOID_TAGS.has(tag) ? '' : `</${canonicalTag}>`;
    }
    const selfClosing = /\/\s*$/.test(rawAttrs) || VOID_TAGS.has(tag);
    const cleanedRawAttrs = rawAttrs.replace(/\/\s*$/, '');
    const attrs = sanitizeAttributes(tag, cleanedRawAttrs);
    return selfClosing && VOID_TAGS.has(tag) ? `<${canonicalTag}${attrs} />` : `<${canonicalTag}${attrs}>`;
  });

  clean = clean.replace(/<(?:\/?[a-zA-Z][a-zA-Z0-9:-]*|!)[^>]*?(?=<|$)/gi, '');

  return clean;
}
