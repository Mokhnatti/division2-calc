#!/usr/bin/env node
/**
 * Extract inline data blocks from index.html into data/*.json files.
 *
 * Each block is `const NAME = <literal>;` where <literal> is a JSON-compatible
 * object/array (no functions, no method calls). We locate the start, walk
 * brackets to find the matching close, then `Function('return ' + body)()` it
 * in a sandbox and serialize to JSON.
 *
 * Idempotent — overwrites data/*.json each run. Does NOT modify index.html.
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "index.html");
const OUT_DIR = path.join(ROOT, "data");

const BLOCKS = [
  { name: "G", file: "gear_sets.json" },
  { name: "B", file: "brands.json" },
  { name: "E", file: "exotics.json" },
  { name: "N", file: "named.json" },
  { name: "TL", file: "type_labels.json" },
  { name: "WPNS_BASE", file: "weapons_base.json" },
  { name: "EXOTIC_WPNS", file: "exotic_weapons.json" },
  { name: "SB", file: "set_bonuses.json" },
  { name: "SLOT_META", file: "slot_meta.json" },
  { name: "TALENT_MATH", file: "talent_math.json" },
  { name: "PROTOTYPE_AUGMENTS", file: "prototype_augments.json" },
  { name: "WEAPON_TALENTS", file: "weapon_talents.json" },
  { name: "ENEMY_HP", file: "enemy_hp.json" },
  { name: "ESCALATION_TIERS", file: "escalation_tiers.json" },
  { name: "ESCALATION_DROP_CHANCE", file: "escalation_drop_chance.json" },
  { name: "PROTO_UPGRADE_COST", file: "proto_upgrade_cost.json" },
  { name: "PROTO_REROLL_COST", file: "proto_reroll_cost.json" },
  { name: "PROTO_ROLL_CHANCE", file: "proto_roll_chance.json" },
  { name: "ESCALATION_MUTATORS", file: "escalation_mutators.json" },
  { name: "ESCALATION_REWARDS", file: "escalation_rewards.json" },
  { name: "STAT_TOOLTIPS", file: "stat_tooltips.json" },
];

function findLiteralEnd(src, startIdx) {
  // startIdx points at the opening `[` or `{`
  const open = src[startIdx];
  const close = open === "[" ? "]" : "}";
  let depth = 0;
  let i = startIdx;
  let inStr = null;
  let inLine = false;
  let inBlock = false;
  while (i < src.length) {
    const c = src[i];
    const next = src[i + 1];
    if (inLine) {
      if (c === "\n") inLine = false;
    } else if (inBlock) {
      if (c === "*" && next === "/") { inBlock = false; i++; }
    } else if (inStr) {
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
  throw new Error("Unbalanced literal starting at " + startIdx);
}

function extract(src, name) {
  const re = new RegExp(`(?:^|\\n)\\s*(?:const|let|var)\\s+${name}\\s*=\\s*`, "m");
  const m = src.match(re);
  if (!m) throw new Error(`Block "${name}" not found`);
  const after = m.index + m[0].length;
  // skip whitespace
  let s = after;
  while (s < src.length && /\s/.test(src[s])) s++;
  const c = src[s];
  if (c !== "[" && c !== "{") {
    throw new Error(`Block "${name}" does not start with [ or { at ${s}`);
  }
  const end = findLiteralEnd(src, s);
  const body = src.slice(s, end + 1);
  // Evaluate in a clean sandbox.
  const sandbox = {};
  vm.createContext(sandbox);
  const value = vm.runInContext(`(${body})`, sandbox, { timeout: 1000 });
  return value;
}

function main() {
  const src = fs.readFileSync(SRC, "utf8");
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const summary = [];
  for (const { name, file } of BLOCKS) {
    try {
      const value = extract(src, name);
      const out = path.join(OUT_DIR, file);
      fs.writeFileSync(out, JSON.stringify(value, null, 2) + "\n", "utf8");
      const size = (fs.statSync(out).size / 1024).toFixed(1);
      const count = Array.isArray(value) ? value.length : Object.keys(value).length;
      summary.push({ name, file, count, kb: size });
    } catch (e) {
      summary.push({ name, file, error: e.message });
    }
  }
  console.table(summary);
  const ok = summary.filter(s => !s.error).length;
  const total = summary.length;
  console.log(`\nExtracted ${ok}/${total} blocks into ${path.relative(ROOT, OUT_DIR)}/`);
  if (ok < total) process.exit(1);
}

main();
