// IndexNow webhook — submits changed URLs to Bing/Yandex/Naver/Seznam
// Google does NOT support IndexNow. Use GSC API for Google.
// Usage:
//   node scripts/indexnow.mjs                 # submit all main URLs
//   node scripts/indexnow.mjs https://divcalc.xyz/weapons/iron-lung
// Setup:
//   1. Generate 32-char key: node -e "console.log(crypto.randomUUID().replace(/-/g,'')+crypto.randomUUID().replace(/-/g,'').slice(0,8))"
//   2. Save in env INDEXNOW_KEY or replace KEY constant below
//   3. Place [KEY].txt file at https://divcalc.xyz/[KEY].txt with key as content

const KEY = process.env.INDEXNOW_KEY || 'REPLACE_WITH_32_CHAR_KEY';
const HOST = 'divcalc.xyz';

if (KEY === 'REPLACE_WITH_32_CHAR_KEY') {
  console.error('Set INDEXNOW_KEY env var or edit the script');
  process.exit(1);
}

const argUrls = process.argv.slice(2);
const urlList = argUrls.length > 0 ? argUrls : [
  `https://${HOST}/`,
  `https://${HOST}/weapons/`,
  `https://${HOST}/sets/`,
  `https://${HOST}/brands/`,
  `https://${HOST}/builds/`,
];

const payload = {
  host: HOST,
  key: KEY,
  keyLocation: `https://${HOST}/${KEY}.txt`,
  urlList,
};

console.log(`Submitting ${urlList.length} URLs to IndexNow...`);
const res = await fetch('https://api.indexnow.org/IndexNow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});

console.log(`Status: ${res.status} ${res.statusText}`);
if (res.status >= 400) {
  const text = await res.text();
  console.error('Body:', text);
  process.exit(1);
}
console.log('✓ Submitted');
