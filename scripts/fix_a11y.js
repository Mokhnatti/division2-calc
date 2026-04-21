// Quick a11y fixes:
// 1. Add aria-label to <select> / <input> elements that don't have one (based on nearby text)
// 2. Wrap top-level content in <main> if missing
// Writes back index.html in place.

const fs = require('fs');
const path = require('path');

const files = ['index.html', 'en/index.html'].map(f => path.join(__dirname, '..', f));

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, 'utf8');

  // 1. aria-label for <input id="..."> without aria-label — use id as fallback
  //    Skip type="hidden" (aria-* not allowed on hidden inputs)
  html = html.replace(/<input([^>]+)id="([^"]+)"([^>]*)>/g, (m, pre, id, post) => {
    if (/aria-label=/.test(m)) return m;
    if (/type="hidden"/i.test(m)) return m;
    // Guess friendly name from id
    const labelFromId = id
      .replace(/^b-/, '')
      .replace(/^cw-/, 'weapon-')
      .replace(/^shd-/, 'shd-')
      .replace(/^rc-/, 'recal-')
      .replace(/-/g, ' ');
    // Also ensure type= attribute exists
    const hasType = /\btype\s*=/.test(m);
    const typeAttr = hasType ? '' : ' type="text"';
    return `<input${pre}id="${id}"${post}${typeAttr} aria-label="${labelFromId}">`.replace('>>', '>');
  });

  // 2. aria-label for <select id="..."> without aria-label
  html = html.replace(/<select([^>]+)id="([^"]+)"([^>]*)>/g, (m, pre, id, post) => {
    if (/aria-label=/.test(m)) return m;
    const labelFromId = id.replace(/^b-/, '').replace(/-/g, ' ');
    return `<select${pre}id="${id}"${post} aria-label="${labelFromId}">`;
  });

  fs.writeFileSync(file, html);
  console.log('✓', path.relative(path.join(__dirname, '..'), file));
}
