#!/usr/bin/env node
/**
 * Merge Teriyaki + Mikeree data into our data/*.json files.
 *
 * Teriyaki: authoritative for weapons (320 entries, exact rpm/damage match)
 * Mikeree:  authoritative for weapon talents (206 entries, has description/stacks/bonus)
 * Our RU:   data/talents_ru.json — official RU names+descriptions from screenshots
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const D = path.join(ROOT, "data");
const DS = path.join(ROOT, "data_sources");

const teriyaki = require(path.join(DS, "teriyaki_db.json"));
const mikeree_wpns = require(path.join(DS, "mikeree/weapons.json"));
const mikeree_tal = require(path.join(DS, "mikeree/talents.json"));
const ru_map = require(path.join(D, "talents_ru.json"));

// ─── 1. WEAPONS ──────────────────────────────────────────────────────────────
// Teriyaki has 320 weapons with clean structure.
// Map to our existing WPNS_BASE schema + add missing fields.
console.log("=== WEAPONS ===");

const tWpns = teriyaki.weapons; // array of {id, name, type, quality, rpm, baseDamage, magazineSize, reloadSpeed, optimalRange, headshotDamage, supportedSlots}
const mWpnByName = {};
Object.values(mikeree_wpns).forEach(w => { mWpnByName[w.name.toLowerCase()] = w; });

// Load existing WPNS_BASE to preserve any extra fields (tal, named, etc.)
const existingWpns = require(path.join(D, "weapons_base.json"));
const existingByName = {};
existingWpns.forEach(w => { existingByName[w.name.toLowerCase()] = w; });

const merged_wpns = tWpns.map(tw => {
  const ex = existingByName[tw.name.toLowerCase()];
  const mw = mWpnByName[tw.name.toLowerCase()];
  return {
    name: tw.name,
    type: tw.type,
    quality: tw.quality || (ex ? ex.quality : "High-End"),
    dmg: tw.baseDamage,
    rpm: tw.rpm,
    mag: tw.magazineSize,
    reload: tw.reloadSpeed,
    range: tw.optimalRange,
    hsd: tw.headshotDamage || (mw ? mw.hsd : 0) || 0,
    slots: tw.supportedSlots || [],
    // Preserve existing extra fields
    tal: ex ? ex.tal : undefined,
    named: ex ? ex.named : undefined,
    g: ex ? ex.g : undefined,
    en: ex ? ex.en : undefined,
  };
}).map(w => {
  // Clean undefined keys
  return Object.fromEntries(Object.entries(w).filter(([,v]) => v !== undefined));
});

fs.writeFileSync(path.join(D, "weapons_base.json"), JSON.stringify(merged_wpns, null, 2) + "\n");
console.log(`weapons_base.json: ${existingWpns.length} → ${merged_wpns.length} weapons`);

// ─── 2. WEAPON TALENTS ───────────────────────────────────────────────────────
console.log("\n=== WEAPON TALENTS ===");

// Mikeree talent structure: { name, type, perfectName, description, perfectDescription, stacks, perfectStacks, bonus, perfectBonus, exclusiveTo }
// Our weapon_talents: { key: { name, bonus: { wd, chc, chd, rof, ... }, conditional, note } }
// New structure: add desc_en, desc_ru (from ru_map), stacks from mikeree

// Build RU lookup by EN name (lowercase)
const ruByEn = {};
Object.values(ru_map).forEach(r => { ruByEn[r.name_en.toLowerCase()] = r; });

// Also build from Teriyaki weaponTalents (for talents mikeree doesn't have)
const tTalByName = {};
teriyaki.weaponTalents.forEach(t => { tTalByName[t.name.toLowerCase()] = t; });

const merged_talents = {};
Object.entries(mikeree_tal).forEach(([key, mt]) => {
  const enName = mt.name;
  const ru = ruByEn[enName.toLowerCase()];
  const tTal = tTalByName[enName.toLowerCase()];

  merged_talents[key] = {
    name_en: enName,
    name_ru: ru ? ru.name_ru : null,
    perfect_name_en: mt.perfectName || null,
    perfect_name_ru: null, // will be filled by Perfect_ lookup below
    desc_en: mt.description || tTal?.description || "",
    desc_ru: ru ? ru.desc_ru : null,
    perfect_desc_en: mt.perfectDescription || "",
    perfect_desc_ru: null,
    type: mt.type || "weapon",
    exclusive_to: mt.exclusiveTo || [],
    stacks: mt.stacks || null,
    perfect_stacks: mt.perfectStacks || null,
    bonus: mt.bonus || null,
    perfect_bonus: mt.perfectBonus || null,
  };
});

// Add Teriyaki-only talents (not in mikeree)
const mikereeNames = new Set(Object.values(mikeree_tal).map(t => t.name.toLowerCase()));
teriyaki.weaponTalents
  .filter(t => !mikereeNames.has(t.name.toLowerCase()))
  .forEach(t => {
    const key = t.name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    const ru = ruByEn[t.name.toLowerCase()];
    merged_talents[key] = {
      name_en: t.name,
      name_ru: ru ? ru.name_ru : null,
      perfect_name_en: null,
      perfect_name_ru: null,
      desc_en: t.description || "",
      desc_ru: ru ? ru.desc_ru : null,
      perfect_desc_en: "",
      perfect_desc_ru: null,
      type: "weapon",
      exclusive_to: [],
      stacks: null,
      bonus: t.modifiers || null,
    };
  });

fs.writeFileSync(path.join(D, "weapon_talents_full.json"), JSON.stringify(merged_talents, null, 2) + "\n");

const withRu = Object.values(merged_talents).filter(t => t.name_ru).length;
const withDesc = Object.values(merged_talents).filter(t => t.desc_en).length;
console.log(`weapon_talents_full.json: ${Object.keys(merged_talents).length} talents`);
console.log(`  with RU name: ${withRu}`);
console.log(`  with EN desc: ${withDesc}`);

// ─── 3. SUMMARY ──────────────────────────────────────────────────────────────
console.log("\n=== DONE ===");
console.log("Files written:");
console.log(" data/weapons_base.json    — Teriyaki full (320 weapons)");
console.log(" data/weapon_talents_full.json — Mikeree+Teriyaki+RU (merged)");
console.log("\nNext: rebuild all.bundle.js and update index.html to use weapon_talents_full");
