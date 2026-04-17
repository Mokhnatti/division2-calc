#!/usr/bin/env node
/**
 * Replace inline `const NAME = <literal>;` data blocks in index.html with
 * `const NAME = D2DATA.NAME;` and inject <script src="data/all.bundle.js">
 * into <head>.
 *
 * Idempotent: detects already-migrated blocks (`= D2DATA.NAME;`) and skips.
 * Backs up the original to index.html.bak before writing.
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "index.html");
const BACKUP = path.join(ROOT, "index.html.bak");

const NAMES = [
  "G", "B", "E", "N", "TL",
  "WPNS_BASE", "EXOTIC_WPNS",
  "SB", "SLOT_META", "TALENT_MATH",
  "PROTOTYPE_AUGMENTS", "WEAPON_TALENTS",
  "ENEMY_HP",
  "ESCALATION_TIERS", "ESCALATION_DROP_CHANCE",
  "PROTO_UPGRADE_COST", "PROTO_REROLL_COST", "PROTO_ROLL_CHANCE",
  "ESCALATION_MUTATORS", "ESCALATION_REWARDS",
  "STAT_TOOLTIPS",
];

const BUNDLE_TAG = '<script src="data/all.bundle.js"></script>';

function findLiteralEnd(src, startIdx) {
  const open = src[startIdx];
  const close = open === "[" ? "]" : "}";
  let depth = 0;
  let i = startIdx;
  let inStr = null;
  let inLine = false;
  let inBlock = false;
  while (i < src.length) {
    const c = src[i], next = src[i + 1];
    if (inLine) { if (c === "\n") inLine = false; }
    else if (inBlock) { if (c === "*" && next === "/") { inBlock = false; i++; } }
    else if (inStr) {
      if (c === "\\") { i += 2; continue; }
      if (c === inStr) inStr = null;
    } else {
      if (c === "/" && next === "/") { inLine = true; i++; }
      else if (c === "/" && next === "*") { inBlock = true; i++; }
      else if (c === '"' || c === "'" || c === "`") inStr = c;
      else if (c === open) depth++;
      else if (c === close) {
        depth--;
        if (depth === 0) return i;
      }
    }
    i++;
  }
  throw new Error("Unbalanced literal at " + startIdx);
}

function locateBlock(src, name) {
  // Match: line-start whitespace + (const|let|var) NAME =
  const re = new RegExp(`(^|\\n)([ \\t]*)(const|let|var)\\s+${name}\\s*=\\s*`, "m");
  const m = src.match(re);
  if (!m) return null;
  // Already migrated?
  const after = src.slice(m.index + m[0].length, m.index + m[0].length + 40);
  if (/^D2DATA\./.test(after)) return { migrated: true };
  // Find literal start (first [ or { after the =)
  let s = m.index + m[0].length;
  while (s < src.length && /\s/.test(src[s])) s++;
  const c = src[s];
  if (c !== "[" && c !== "{") {
    throw new Error(`Block "${name}": no literal at ${s} (got ${JSON.stringify(c)})`);
  }
  const end = findLiteralEnd(src, s);
  // Include trailing semicolon if present
  let semi = end + 1;
  while (semi < src.length && /[ \t]/.test(src[semi])) semi++;
  if (src[semi] === ";") semi++;
  // Validate the literal evaluates cleanly
  const body = src.slice(s, end + 1);
  vm.runInContext(`(${body})`, vm.createContext({}), { timeout: 1000 });
  return {
    migrated: false,
    declStart: m.index + (m[1] ? m[1].length : 0), // skip the leading newline
    declEnd: semi,
    indent: m[2],
    keyword: m[3],
    name,
  };
}

function main() {
  let src = fs.readFileSync(SRC, "utf8");
  fs.writeFileSync(BACKUP, src, "utf8");

  // Locate all blocks first (without mutating)
  const blocks = [];
  for (const name of NAMES) {
    const loc = locateBlock(src, name);
    if (!loc) { console.warn(`! Block "${name}" NOT FOUND — skipped`); continue; }
    if (loc.migrated) { console.log(`= ${name}: already migrated`); continue; }
    blocks.push(loc);
  }
  // Apply replacements from bottom to top (preserves indices)
  blocks.sort((a, b) => b.declStart - a.declStart);
  for (const b of blocks) {
    const replacement = `${b.indent}${b.keyword} ${b.name} = D2DATA.${b.name};`;
    src = src.slice(0, b.declStart) + replacement + src.slice(b.declEnd);
    console.log(`+ ${b.name}: replaced ${b.declEnd - b.declStart} chars`);
  }

  // Inject bundle script tag before </head> if not already present
  if (!src.includes(BUNDLE_TAG)) {
    const headEnd = src.indexOf("</head>");
    if (headEnd === -1) throw new Error("</head> not found");
    src = src.slice(0, headEnd) + "    " + BUNDLE_TAG + "\n" + src.slice(headEnd);
    console.log(`+ injected ${BUNDLE_TAG} into <head>`);
  } else {
    console.log(`= bundle script tag already present`);
  }

  fs.writeFileSync(SRC, src, "utf8");
  const oldKB = (fs.statSync(BACKUP).size / 1024).toFixed(1);
  const newKB = (fs.statSync(SRC).size / 1024).toFixed(1);
  console.log(`\nindex.html: ${oldKB} KB -> ${newKB} KB (backup at index.html.bak)`);
}

main();
