// Tom Clancy's The Division 2 – Rise Up (Y8S1) Passive Modifiers
// Values are based on in-game data for the Y8S1 season

// Offense: weaponHandling (default, 1%/stack), headshotDamage (C1, 3%/stack), magazineSize (C2, 1%/stack)
// Defense: totalArmor (default, 0.5%/stack), protectionFromElites (C1, 0.5%/stack), hazardProtection (C2, 1%/stack)
// Utility: skillDamage (default, 1%/stack), skillRepair (C1, 1%/stack), statusEffects (C2, 1%/stack)
export type StatKey =
  | 'weaponHandling'
  | 'headshotDamage'
  | 'magazineSize'
  | 'totalArmor'
  | 'protectionFromElites'
  | 'hazardProtection'
  | 'skillDamage'
  | 'statusEffects'
  | 'skillRepair'

export const STAT_LABELS: Record<StatKey, string> = {
  weaponHandling: 'Weapon Handling',
  headshotDamage: 'Headshot Damage',
  magazineSize: 'Magazine Size',
  totalArmor: 'Max Armor',
  protectionFromElites: 'Protection from Elites',
  hazardProtection: 'Hazard Protection',
  skillDamage: 'Skill Damage',
  statusEffects: 'Status Effects',
  skillRepair: 'Skill Repair',
}

export type Category = 'Offense' | 'Defense' | 'Utility' | 'Wildcard'

/** How a modifier changes stack counts across categories */
export interface StackChange {
  category: Category
  /** Positive = add stacks, negative = remove stacks */
  amount: number
}

/**
 * How a modifier changes the stat a stack category contributes to.
 * - none        : no change; stacks contribute to their default stat
 * - saturate    : stacks stop contributing to stats entirely
 * - compress    : removes stacks but makes remaining ones more potent
 * - convert     : stacks contribute to a different stat instead
 * - redistribute: stacks are moved to other categories
 */
export type EffectType = 'none' | 'saturate' | 'compress' | 'convert' | 'redistribute' | 'pivot' | 'nullify' | 'cascade' | 'converge' | 'equalize' | 'invert' | 'stabilize'

export interface ModifierStat {
  stat: StatKey
  /** Base value when this is the first modifier selected (percent, e.g. 10 = 10%) */
  baseValue: number
  /** Additional value gained per extra modifier also providing this stat */
  synergyBonus: number
}

export interface Modifier {
  id: string
  name: string
  category: Category
  description: string
  /** Stack count changes this modifier applies */
  stackChanges: StackChange[]
  /** The type of stat-contribution effect this modifier has */
  effectType: EffectType
  /** Human-readable description of the stat / effect change */
  effectDescription: string
  /** Approximate stat bonuses used for display and synergy calculation */
  stats: ModifierStat[]
  /** IDs of modifiers that pair especially well with this one */
  synergyWith: string[]
  icon: string
}

// ─── OFFENSE ─────────────────────────────────────────────────────────────────
// Source: in-game seasonal modifier table (Offense category)
// Default stat for Offense stacks is Weapon Handling.

const OFFENSE_MODIFIERS: Modifier[] = [
  {
    id: 'amplify',
    name: 'Amplify',
    category: 'Offense',
    description: 'Adds 5 Offense stacks with no change to contribution type.',
    stackChanges: [{ category: 'Offense', amount: 5 }],
    effectType: 'none',
    effectDescription: 'No change to stat type',
    // ~1% weapon handling per stack × +5 stacks
    stats: [{ stat: 'weaponHandling', baseValue: 5, synergyBonus: 1 }],
    synergyWith: ['compress', 'convert1', 'convert2'],
    icon: '📈',
  },
  {
    id: 'consume',
    name: 'Consume',
    category: 'Offense',
    description: 'Gains 10 Offense stacks by consuming 5 Defense and 5 Utility stacks.',
    stackChanges: [
      { category: 'Offense', amount: 10 },
      { category: 'Defense', amount: -5 },
      { category: 'Utility', amount: -5 },
    ],
    effectType: 'none',
    effectDescription: 'No change to stat type',
    // ~1% weapon handling per stack × +10 offense stacks (net gain)
    stats: [{ stat: 'weaponHandling', baseValue: 10, synergyBonus: 2 }],
    synergyWith: ['amplify', 'compress', 'convert1', 'convert2'],
    icon: '🔄',
  },
  {
    id: 'saturate',
    name: 'Saturate',
    category: 'Offense',
    description: 'Adds 25 Offense stacks, but they no longer contribute to stats.',
    stackChanges: [{ category: 'Offense', amount: 25 }],
    effectType: 'saturate',
    effectDescription: 'Offense stacks stop contributing to stats (still count for other passives)',
    stats: [],
    synergyWith: ['compress'],
    icon: '💧',
  },
  {
    id: 'compress',
    name: 'Compress',
    category: 'Offense',
    description: 'Removes 10 Offense stacks, but each remaining stack is 50% more potent.',
    stackChanges: [{ category: 'Offense', amount: -10 }],
    effectType: 'compress',
    effectDescription: 'Each remaining Offense stack is 50% more potent',
    // Value scales with remaining stacks; synergy bonus represents potency gain
    stats: [{ stat: 'weaponHandling', baseValue: 0, synergyBonus: 8 }],
    synergyWith: ['amplify', 'consume', 'saturate', 'convert1', 'convert2'],
    icon: '🗜️',
  },
  {
    id: 'convert1',
    name: 'Convert 1',
    category: 'Offense',
    description: 'Offense stacks now provide Headshot Damage at 3% per stack instead of Weapon Handling.',
    stackChanges: [],
    effectType: 'convert',
    effectDescription: 'Offense → Headshot Damage (base 3% per stack) instead of Weapon Handling',
    // 3% per stack × ~10 base offense stacks
    stats: [{ stat: 'headshotDamage', baseValue: 30, synergyBonus: 6 }],
    synergyWith: ['amplify', 'consume', 'compress'],
    icon: '🎯',
  },
  {
    id: 'convert2',
    name: 'Convert 2',
    category: 'Offense',
    description: 'Offense stacks now provide Magazine Size at 1% per stack instead of Weapon Handling.',
    stackChanges: [],
    effectType: 'convert',
    effectDescription: 'Offense → Magazine Size (base 1% per stack) instead of Weapon Handling',
    // 1% per stack × ~10 base offense stacks
    stats: [{ stat: 'magazineSize', baseValue: 10, synergyBonus: 2 }],
    synergyWith: ['amplify', 'consume', 'compress'],
    icon: '🔋',
  },
  {
    id: 'split',
    name: 'Split',
    category: 'Offense',
    description: 'Redistributes 15 Offense stacks as 10 Defense and 10 Utility stacks.',
    stackChanges: [
      { category: 'Offense', amount: -15 },
      { category: 'Defense', amount: 10 },
      { category: 'Utility', amount: 10 },
    ],
    effectType: 'redistribute',
    effectDescription: 'Redistributes stacks',
    stats: [],
    synergyWith: [],
    icon: '↔️',
  },
  {
    id: 'pivotO',
    name: 'Pivot',
    category: 'Offense',
    description: 'Boosts the current lowest module by increasing whichever module is currently the lowest.',
    stackChanges: [],
    effectType: 'pivot',
    effectDescription: 'Increases whichever module is currently the lowest',
    stats: [],
    synergyWith: [],
    icon: '🔃',
  },
  {
    id: 'invertO',
    name: 'Invert',
    category: 'Offense',
    description: 'Swap Offense stacks with the current highest module stacks. If Offense stacks are already the highest, or Defense and Utility stacks are tied for highest, nothing happens.',
    stackChanges: [],
    effectType: 'invert',
    effectDescription: 'Swaps Offense stacks with the highest other module. Fails if Offense is already the highest, or if Defense and Utility are tied for highest.',
    stats: [],
    synergyWith: [],
    icon: '🔀',
  },
  {
    id: 'stabilizeO',
    name: 'Stabilize',
    category: 'Offense',
    description: 'Offense stacks are locked and cannot change.',
    stackChanges: [],
    effectType: 'stabilize',
    effectDescription: 'Offense stacks are frozen at their current value; all subsequent changes to Offense stacks are ignored.',
    stats: [],
    synergyWith: ['amplify', 'consume'],
    icon: '🔒',
  },
]

// ─── DEFENSE ─────────────────────────────────────────────────────────────────
// Values verified in-game (Y8S1 Rise Up)
// Default stat for Defense stacks is Max Armor (Total Armor).

const DEFENSE_MODIFIERS: Modifier[] = [
  {
    id: 'amplifyD',
    name: 'Amplify',
    category: 'Defense',
    description: 'Adds 5 Defense stacks with no change to contribution type.',
    stackChanges: [{ category: 'Defense', amount: 5 }],
    effectType: 'none',
    effectDescription: 'No change to stat type',
    // ~0.5% total armor per stack × +5 stacks
    stats: [{ stat: 'totalArmor', baseValue: 2.5, synergyBonus: 1 }],
    synergyWith: ['compressD', 'convert1D', 'convert2D'],
    icon: '📈',
  },
  {
    id: 'consumeD',
    name: 'Consume',
    category: 'Defense',
    description: 'Gains 10 Defense stacks by consuming 5 Offense and 5 Utility stacks.',
    stackChanges: [
      { category: 'Defense', amount: 10 },
      { category: 'Offense', amount: -5 },
      { category: 'Utility', amount: -5 },
    ],
    effectType: 'none',
    effectDescription: 'No change to stat type',
    // ~0.5% total armor per stack × +10 defense stacks (net gain)
    stats: [{ stat: 'totalArmor', baseValue: 5, synergyBonus: 2 }],
    synergyWith: ['amplifyD', 'compressD', 'convert1D', 'convert2D'],
    icon: '🔄',
  },
  {
    id: 'saturateD',
    name: 'Saturate',
    category: 'Defense',
    description: 'Adds 25 Defense stacks, but they no longer contribute to stats.',
    stackChanges: [{ category: 'Defense', amount: 25 }],
    effectType: 'saturate',
    effectDescription: 'Defense stacks stop contributing to stats (still count for other passives such as Cascade/Convert)',
    stats: [],
    synergyWith: ['cascade', 'convert1D', 'convert2D'],
    icon: '💧',
  },
  {
    id: 'compressD',
    name: 'Compress',
    category: 'Defense',
    description: 'Removes 10 Defense stacks, but each remaining stack is 50% more potent.',
    stackChanges: [{ category: 'Defense', amount: -10 }],
    effectType: 'compress',
    effectDescription: 'Each remaining Defense stack is 50% more potent',
    stats: [{ stat: 'totalArmor', baseValue: 0, synergyBonus: 6 }],
    synergyWith: ['amplifyD', 'consumeD', 'nullify', 'convert1D', 'convert2D'],
    icon: '🗜️',
  },
  {
    id: 'convert1D',
    name: 'Convert 1',
    category: 'Defense',
    description: 'Defense stacks now provide Protection from Elites at 0.5% per stack instead of Max Armor.',
    stackChanges: [],
    effectType: 'convert',
    effectDescription: 'Defense → Protection from Elites (0.5%/stack base, 0.75%/stack with Compress+Nullify) instead of Max Armor. Best with Compress+Nullify (30 stacks × 1.5 potency) = 22.5% Protection from Elites.',
    // 0.5% per stack × 20 base defense stacks = 10% Protection from Elites (base); 0.5% × 1.5 potency × 30 stacks (Compress+Nullify) = 22.5% Protection from Elites
    stats: [{ stat: 'protectionFromElites', baseValue: 10, synergyBonus: 4.5 }],
    synergyWith: ['amplifyD', 'consumeD', 'saturateD', 'compressD'],
    icon: '⭐',
  },
  {
    id: 'convert2D',
    name: 'Convert 2',
    category: 'Defense',
    description: 'Defense stacks now provide Hazard Protection at 1% per stack instead of Max Armor.',
    stackChanges: [],
    effectType: 'convert',
    effectDescription: 'Defense → Hazard Protection (1%/stack base, 1.5%/stack with Compress) instead of Max Armor.',
    // 1% per stack × 20 base defense stacks = 20% Hazard Protection (base); 1.5%/stack with Compress active (1% × 1.5 potency = 1.5%, giving up to 30% with 20 stacks)
    stats: [{ stat: 'hazardProtection', baseValue: 20, synergyBonus: 6 }],
    synergyWith: ['amplifyD', 'consumeD', 'compressD'],
    icon: '☢️',
  },
  {
    id: 'splitD',
    name: 'Split',
    category: 'Defense',
    description: 'Redistributes 15 Defense stacks as 10 Offense and 10 Utility stacks.',
    stackChanges: [
      { category: 'Defense', amount: -15 },
      { category: 'Offense', amount: 10 },
      { category: 'Utility', amount: 10 },
    ],
    effectType: 'redistribute',
    effectDescription: 'Redistributes stacks',
    stats: [],
    synergyWith: [],
    icon: '↔️',
  },
  {
    id: 'pivotD',
    name: 'Pivot',
    category: 'Defense',
    description: 'Boosts the current lowest module using Defense stacks.',
    stackChanges: [],
    effectType: 'pivot',
    effectDescription: 'Increases the lowest module’s stacks using available Defense stacks. Useful in recovery builds.',
    stats: [],
    synergyWith: [],
    icon: '🔁',
  },
  {
    id: 'invertD',
    name: 'Invert',
    category: 'Defense',
    description: 'Swap Defense stacks with the current highest module stacks. If Defense stacks are already the highest, or Offense and Utility stacks are tied for highest, nothing happens.',
    stackChanges: [],
    effectType: 'invert',
    effectDescription: 'Swaps Defense stacks with the highest other module. Fails if Defense is already the highest, or if Offense and Utility are tied for highest.',
    stats: [],
    synergyWith: [],
    icon: '🔀',
  },
  {
    id: 'stabilizeD',
    name: 'Stabilize',
    category: 'Defense',
    description: 'Defense stacks are locked and cannot change.',
    stackChanges: [],
    effectType: 'stabilize',
    effectDescription: 'Defense stacks are frozen at their current value; all subsequent changes to Defense stacks are ignored.',
    stats: [],
    synergyWith: ['amplifyD', 'consumeD'],
    icon: '🔒',
  },
]

// ─── UTILITY ─────────────────────────────────────────────────────────────────
// Values verified in-game (Y8S1 Rise Up)

const UTILITY_MODIFIERS: Modifier[] = [
  {
    id: 'amplifyU',
    name: 'Amplify',
    category: 'Utility',
    description: 'Adds 5 Utility stacks with no change to contribution type.',
    stackChanges: [{ category: 'Utility', amount: 5 }],
    effectType: 'none',
    effectDescription: 'No change to stat type',
    stats: [{ stat: 'skillDamage', baseValue: 5, synergyBonus: 1 }],
    synergyWith: ['compressU', 'convert1U', 'convert2U'],
    icon: '📈',
  },
  {
    id: 'consumeU',
    name: 'Consume',
    category: 'Utility',
    description: 'Gains 10 Utility stacks by consuming 5 Offense and 5 Defense stacks.',
    stackChanges: [
      { category: 'Utility', amount: 10 },
      { category: 'Offense', amount: -5 },
      { category: 'Defense', amount: -5 },
    ],
    effectType: 'none',
    effectDescription: 'No change to stat type',
    stats: [{ stat: 'skillDamage', baseValue: 10, synergyBonus: 2 }],
    synergyWith: ['amplifyU', 'compressU', 'convert1U', 'convert2U'],
    icon: '🔄',
  },
  {
    id: 'saturateU',
    name: 'Saturate',
    category: 'Utility',
    description: 'Adds 25 Utility stacks, but they no longer contribute to stats.',
    stackChanges: [{ category: 'Utility', amount: 25 }],
    effectType: 'saturate',
    effectDescription: 'Utility stacks stop contributing to stats (still count for other passives)',
    stats: [],
    synergyWith: ['cascade', 'converge'],
    icon: '💧',
  },
  {
    id: 'compressU',
    name: 'Compress',
    category: 'Utility',
    description: 'Removes 10 Utility stacks, but each remaining stack is 50% more potent.',
    stackChanges: [{ category: 'Utility', amount: -10 }],
    effectType: 'compress',
    effectDescription: 'Each remaining Utility stack is 50% more potent',
    stats: [{ stat: 'skillDamage', baseValue: 0, synergyBonus: 8 }],
    synergyWith: ['amplifyU', 'consumeU', 'saturateU', 'convert1U', 'convert2U'],
    icon: '🗜️',
  },
  {
    id: 'convert1U',
    name: 'Convert 1',
    category: 'Utility',
    description: 'Utility stacks now provide Skill Repair at 1% per stack instead of Skill Damage.',
    stackChanges: [],
    effectType: 'convert',
    effectDescription: 'Utility → Skill Repair (1%/stack) instead of Skill Damage',
    stats: [{ stat: 'skillRepair', baseValue: 20, synergyBonus: 5 }],
    synergyWith: ['amplifyU', 'consumeU', 'compressU'],
    icon: '🩹',
  },
  {
    id: 'convert2U',
    name: 'Convert 2',
    category: 'Utility',
    description: 'Utility stacks now provide Status Effects at 1% per stack instead of Skill Damage.',
    stackChanges: [],
    effectType: 'convert',
    effectDescription: 'Utility → Status Effects (1%/stack) instead of Skill Damage',
    stats: [{ stat: 'statusEffects', baseValue: 20, synergyBonus: 5 }],
    synergyWith: ['amplifyU', 'consumeU', 'compressU'],
    icon: '☣️',
  },
  {
    id: 'splitU',
    name: 'Split',
    category: 'Utility',
    description: 'Redistributes 15 Utility stacks as 10 Offense and 10 Defense stacks.',
    stackChanges: [
      { category: 'Utility', amount: -15 },
      { category: 'Offense', amount: 10 },
      { category: 'Defense', amount: 10 },
    ],
    effectType: 'redistribute',
    effectDescription: 'Redistributes stacks',
    stats: [],
    synergyWith: [],
    icon: '↔️',
  },
  {
    id: 'pivotU',
    name: 'Pivot',
    category: 'Utility',
    description: 'Boosts the current lowest module by increasing whichever module is currently the lowest.',
    stackChanges: [],
    effectType: 'pivot',
    effectDescription: 'Increases whichever module is currently the lowest',
    stats: [],
    synergyWith: [],
    icon: '🔃',
  },
  {
    id: 'invertU',
    name: 'Invert',
    category: 'Utility',
    description: 'Swap Utility stacks with the current highest module stacks. If Utility stacks are already the highest, or Offense and Defense stacks are tied for highest, nothing happens.',
    stackChanges: [],
    effectType: 'invert',
    effectDescription: 'Swaps Utility stacks with the highest other module. Fails if Utility is already the highest, or if Offense and Defense are tied for highest.',
    stats: [],
    synergyWith: [],
    icon: '🔀',
  },
  {
    id: 'stabilizeU',
    name: 'Stabilize',
    category: 'Utility',
    description: 'Utility stacks are locked and cannot change.',
    stackChanges: [],
    effectType: 'stabilize',
    effectDescription: 'Utility stacks are frozen at their current value; all subsequent changes to Utility stacks are ignored.',
    stats: [],
    synergyWith: ['amplifyU', 'consumeU'],
    icon: '🔒',
  },
]

// ─── WILDCARD ───────────────────────────────────────────────────────────────
// Values verified in-game (Y8S1 Rise Up)

const WILDCARD_MODIFIERS: Modifier[] = [
  {
    id: 'nullify',
    name: 'Nullify',
    category: 'Wildcard',
    description:
      'Reverses all previous value changes on the lowest module — additions become subtractions and vice-versa.',
    stackChanges: [],
    effectType: 'nullify',
    effectDescription:
      'Reverses additions/subtractions on the lowest stack module. Fails if two or more modules are tied for lowest. Invert passives are unaffected.',
    stats: [],
    synergyWith: ['compress', 'convert1', 'convert2'],
    icon: '↩️',
  },
  {
    id: 'cascade',
    name: 'Cascade',
    category: 'Wildcard',
    description:
      'Disables the highest module’s stacks, then splits half its value (rounded up) equally into the other two modules.',
    stackChanges: [],
    effectType: 'cascade',
    effectDescription:
      'Highest module’s stacks stop contributing; +⌈highest/2⌉ stacks added to each other two modules. Fails if two or more tied for highest.',
    stats: [],
    synergyWith: ['amplify', 'consume'],
    icon: '🌀',
  },
  {
    id: 'converge',
    name: 'Converge',
    category: 'Wildcard',
    description:
      'The lowest module gains the average of the other two modules’ stacks; the other two are then reduced to 0.',
    stackChanges: [],
    effectType: 'converge',
    effectDescription:
      'Lowest module = average of the other two, then the other two drop to 0. Fails if two or more tied for lowest.',
    stats: [],
    synergyWith: ['amplify', 'consume', 'saturate'],
    icon: '➡️',
  },
  {
    id: 'equalize',
    name: 'Equalize',
    category: 'Wildcard',
    description: 'All three modules become equal to the middle stack value.',
    stackChanges: [],
    effectType: 'equalize',
    effectDescription:
      'All modules set to the median stack count. Fails if the middle value is tied with the highest or lowest.',
    stats: [],
    synergyWith: [],
    icon: '⚖️',
  },
]

export const ALL_MODIFIERS: Modifier[] = [
  ...OFFENSE_MODIFIERS,
  ...DEFENSE_MODIFIERS,
  ...UTILITY_MODIFIERS,
  ...WILDCARD_MODIFIERS,
]

export const MODIFIERS_BY_CATEGORY: Record<Category, Modifier[]> = {
  Offense: OFFENSE_MODIFIERS,
  Defense: DEFENSE_MODIFIERS,
  Utility: UTILITY_MODIFIERS,
  Wildcard: WILDCARD_MODIFIERS,
}

export const MAX_SELECTED = 3
