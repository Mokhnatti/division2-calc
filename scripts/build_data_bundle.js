#!/usr/bin/env node
/**
 * Bundle data/*.json into data/all.bundle.js as `window.D2DATA = {...}`.
 *
 * Loaded synchronously via <script src="data/all.bundle.js"> before the main
 * inline <script>, so existing code keeps using G/B/E/N/... synchronously
 * (each declared as `const X = D2DATA.X;`).
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "data");
const OUT = path.join(DATA, "all.bundle.js");

const FILES = {
  G: "gear_sets.json",
  B: "brands.json",
  E: "exotics.json",
  N: "named.json",
  NAMED_GEAR: "named_gear.json",
  TL: "type_labels.json",
  WPNS_BASE: "weapons_base.json",
  EXOTIC_WPNS: "exotic_weapons.json",
  SB: "set_bonuses.json",
  SLOT_META: "slot_meta.json",
  TALENT_MATH: "talent_math.json",
  PROTOTYPE_AUGMENTS: "prototype_augments.json",
  WEAPON_TALENTS: "weapon_talents.json",
  WEAPON_TALENTS_FULL: "weapon_talents_full.json",
  ENEMY_HP: "enemy_hp.json",
  ESCALATION_TIERS: "escalation_tiers.json",
  ESCALATION_DROP_CHANCE: "escalation_drop_chance.json",
  PROTO_UPGRADE_COST: "proto_upgrade_cost.json",
  PROTO_REROLL_COST: "proto_reroll_cost.json",
  PROTO_ROLL_CHANCE: "proto_roll_chance.json",
  ESCALATION_MUTATORS: "escalation_mutators.json",
  ESCALATION_REWARDS: "escalation_rewards.json",
  STAT_TOOLTIPS: "stat_tooltips.json",
  WEAPON_MODS: "weapon_mods.json",
  GEAR_MODS: "gear_mods.json",
  SKILL_MODS: "skill_mods.json",
  EXPERTISE: "expertise.json",
  GEAR_TALENTS: "gear_talents.json",
  SKILLS_DATA: "skills_data.json",
  META_BUILDS: "meta_builds.json",
  UI_TRANSLATIONS: "ui_translations.json",
  STATUS_EFFECTS: "status_effects.json",
  FORMULAS: "formulas.json",
  SPECIALIZATION_WEAPONS: "specialization_weapons.json",
  ATTRIBUTE_DICT: "attribute_dict.json",
  SOURCES: "sources_compact.json",
  KNOWN_SOURCES: "known_sources.json",
  DIFFICULTY_TABLE: "difficulty_table.json",
};

const obj = {};
for (const [key, file] of Object.entries(FILES)) {
  const p = path.join(DATA, file);
  if (!fs.existsSync(p)) {
    console.error(`Missing ${file} — run extract_data.js first`);
    process.exit(1);
  }
  obj[key] = JSON.parse(fs.readFileSync(p, "utf8"));
}

fs.writeFileSync(OUT, "window.D2DATA=" + JSON.stringify(obj) + ";\n", "utf8");
const kb = (fs.statSync(OUT).size / 1024).toFixed(1);
console.log(`Wrote ${path.relative(ROOT, OUT)}: ${kb} KB (${Object.keys(obj).length} blocks)`);
