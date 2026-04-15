// Serk4 Recombinant modifiers — generated from serk4_recombinant_modifiers.ts
const RECOMBINATOR_MODIFIERS=[
  {
    "id": "amplify",
    "name": "Amplify",
    "category": "Offense",
    "description": "Adds 5 Offense stacks with no change to contribution type.",
    "effectDesc": "No change to stat type",
    "effectType": "none",
    "icon": "📈",
    "stackChanges": [
      {
        "cat": "Offense",
        "amount": 5
      }
    ],
    "stats": [
      {
        "stat": "weaponHandling",
        "base": 5,
        "synergy": 1
      }
    ],
    "synergy": [
      "compress",
      "convert1",
      "convert2"
    ]
  },
  {
    "id": "consume",
    "name": "Consume",
    "category": "Offense",
    "description": "Gains 10 Offense stacks by consuming 5 Defense and 5 Utility stacks.",
    "effectDesc": "No change to stat type",
    "effectType": "none",
    "icon": "🔄",
    "stackChanges": [
      {
        "cat": "Offense",
        "amount": 10
      },
      {
        "cat": "Defense",
        "amount": -5
      },
      {
        "cat": "Utility",
        "amount": -5
      }
    ],
    "stats": [
      {
        "stat": "weaponHandling",
        "base": 10,
        "synergy": 2
      }
    ],
    "synergy": [
      "amplify",
      "compress",
      "convert1",
      "convert2"
    ]
  },
  {
    "id": "saturate",
    "name": "Saturate",
    "category": "Offense",
    "description": "Adds 25 Offense stacks, but they no longer contribute to stats.",
    "effectDesc": "Offense stacks stop contributing to stats (still count for other passives)",
    "effectType": "saturate",
    "icon": "💧",
    "stackChanges": [
      {
        "cat": "Offense",
        "amount": 25
      }
    ],
    "stats": [],
    "synergy": [
      "compress"
    ]
  },
  {
    "id": "compress",
    "name": "Compress",
    "category": "Offense",
    "description": "Removes 10 Offense stacks, but each remaining stack is 50% more potent.",
    "effectDesc": "Each remaining Offense stack is 50% more potent",
    "effectType": "compress",
    "icon": "🗜️",
    "stackChanges": [
      {
        "cat": "Offense",
        "amount": -10
      }
    ],
    "stats": [
      {
        "stat": "weaponHandling",
        "base": 0,
        "synergy": 8
      }
    ],
    "synergy": [
      "amplify",
      "consume",
      "saturate",
      "convert1",
      "convert2"
    ]
  },
  {
    "id": "convert1",
    "name": "Convert 1",
    "category": "Offense",
    "description": "Offense stacks now provide Headshot Damage at 3% per stack instead of Weapon Handling.",
    "effectDesc": "Offense → Headshot Damage (base 3% per stack) instead of Weapon Handling",
    "effectType": "convert",
    "icon": "🎯",
    "stackChanges": [],
    "stats": [
      {
        "stat": "headshotDamage",
        "base": 30,
        "synergy": 6
      }
    ],
    "synergy": [
      "amplify",
      "consume",
      "compress"
    ]
  },
  {
    "id": "convert2",
    "name": "Convert 2",
    "category": "Offense",
    "description": "Offense stacks now provide Magazine Size at 1% per stack instead of Weapon Handling.",
    "effectDesc": "Offense → Magazine Size (base 1% per stack) instead of Weapon Handling",
    "effectType": "convert",
    "icon": "🔋",
    "stackChanges": [],
    "stats": [
      {
        "stat": "magazineSize",
        "base": 10,
        "synergy": 2
      }
    ],
    "synergy": [
      "amplify",
      "consume",
      "compress"
    ]
  },
  {
    "id": "split",
    "name": "Split",
    "category": "Offense",
    "description": "Redistributes 15 Offense stacks as 10 Defense and 10 Utility stacks.",
    "effectDesc": "Redistributes stacks",
    "effectType": "redistribute",
    "icon": "↔️",
    "stackChanges": [
      {
        "cat": "Offense",
        "amount": -15
      },
      {
        "cat": "Defense",
        "amount": 10
      },
      {
        "cat": "Utility",
        "amount": 10
      }
    ],
    "stats": [],
    "synergy": []
  },
  {
    "id": "pivotO",
    "name": "Pivot",
    "category": "Offense",
    "description": "Boosts the current lowest module by increasing whichever module is currently the lowest.",
    "effectDesc": "Increases whichever module is currently the lowest",
    "effectType": "pivot",
    "icon": "🔃",
    "stackChanges": [],
    "stats": [],
    "synergy": []
  },
  {
    "id": "invertO",
    "name": "Invert",
    "category": "Offense",
    "description": "Swap Offense stacks with the current highest module stacks. If Offense stacks are already the highest, or Defense and Utility stacks are tied for highest, nothing happens.",
    "effectDesc": "Swaps Offense stacks with the highest other module. Fails if Offense is already the highest, or if Defense and Utility are tied for highest.",
    "effectType": "invert",
    "icon": "🔀",
    "stackChanges": [],
    "stats": [],
    "synergy": []
  },
  {
    "id": "stabilizeO",
    "name": "Stabilize",
    "category": "Offense",
    "description": "Offense stacks are locked and cannot change.",
    "effectDesc": "Offense stacks are frozen at their current value; all subsequent changes to Offense stacks are ignored.",
    "effectType": "stabilize",
    "icon": "🔒",
    "stackChanges": [],
    "stats": [],
    "synergy": [
      "amplify",
      "consume"
    ]
  },
  {
    "id": "amplifyD",
    "name": "Amplify",
    "category": "Defense",
    "description": "Adds 5 Defense stacks with no change to contribution type.",
    "effectDesc": "No change to stat type",
    "effectType": "none",
    "icon": "📈",
    "stackChanges": [
      {
        "cat": "Defense",
        "amount": 5
      }
    ],
    "stats": [
      {
        "stat": "totalArmor",
        "base": 2.5,
        "synergy": 1
      }
    ],
    "synergy": [
      "compressD",
      "convert1D",
      "convert2D"
    ]
  },
  {
    "id": "consumeD",
    "name": "Consume",
    "category": "Defense",
    "description": "Gains 10 Defense stacks by consuming 5 Offense and 5 Utility stacks.",
    "effectDesc": "No change to stat type",
    "effectType": "none",
    "icon": "🔄",
    "stackChanges": [
      {
        "cat": "Defense",
        "amount": 10
      },
      {
        "cat": "Offense",
        "amount": -5
      },
      {
        "cat": "Utility",
        "amount": -5
      }
    ],
    "stats": [
      {
        "stat": "totalArmor",
        "base": 5,
        "synergy": 2
      }
    ],
    "synergy": [
      "amplifyD",
      "compressD",
      "convert1D",
      "convert2D"
    ]
  },
  {
    "id": "saturateD",
    "name": "Saturate",
    "category": "Defense",
    "description": "Adds 25 Defense stacks, but they no longer contribute to stats.",
    "effectDesc": "Defense stacks stop contributing to stats (still count for other passives such as Cascade/Convert)",
    "effectType": "saturate",
    "icon": "💧",
    "stackChanges": [
      {
        "cat": "Defense",
        "amount": 25
      }
    ],
    "stats": [],
    "synergy": [
      "cascade",
      "convert1D",
      "convert2D"
    ]
  },
  {
    "id": "compressD",
    "name": "Compress",
    "category": "Defense",
    "description": "Removes 10 Defense stacks, but each remaining stack is 50% more potent.",
    "effectDesc": "Each remaining Defense stack is 50% more potent",
    "effectType": "compress",
    "icon": "🗜️",
    "stackChanges": [
      {
        "cat": "Defense",
        "amount": -10
      }
    ],
    "stats": [
      {
        "stat": "totalArmor",
        "base": 0,
        "synergy": 6
      }
    ],
    "synergy": [
      "amplifyD",
      "consumeD",
      "nullify",
      "convert1D",
      "convert2D"
    ]
  },
  {
    "id": "convert1D",
    "name": "Convert 1",
    "category": "Defense",
    "description": "Defense stacks now provide Protection from Elites at 0.5% per stack instead of Max Armor.",
    "effectDesc": "Defense → Protection from Elites (0.5%/stack base, 0.75%/stack with Compress+Nullify) instead of Max Armor. Best with Compress+Nullify (30 stacks × 1.5 potency) = 22.5% Protection from Elites.",
    "effectType": "convert",
    "icon": "⭐",
    "stackChanges": [],
    "stats": [
      {
        "stat": "protectionFromElites",
        "base": 10,
        "synergy": 4.5
      }
    ],
    "synergy": [
      "amplifyD",
      "consumeD",
      "saturateD",
      "compressD"
    ]
  },
  {
    "id": "convert2D",
    "name": "Convert 2",
    "category": "Defense",
    "description": "Defense stacks now provide Hazard Protection at 1% per stack instead of Max Armor.",
    "effectDesc": "Defense → Hazard Protection (1%/stack base, 1.5%/stack with Compress) instead of Max Armor.",
    "effectType": "convert",
    "icon": "☢️",
    "stackChanges": [],
    "stats": [
      {
        "stat": "hazardProtection",
        "base": 20,
        "synergy": 6
      }
    ],
    "synergy": [
      "amplifyD",
      "consumeD",
      "compressD"
    ]
  },
  {
    "id": "splitD",
    "name": "Split",
    "category": "Defense",
    "description": "Redistributes 15 Defense stacks as 10 Offense and 10 Utility stacks.",
    "effectDesc": "Redistributes stacks",
    "effectType": "redistribute",
    "icon": "↔️",
    "stackChanges": [
      {
        "cat": "Defense",
        "amount": -15
      },
      {
        "cat": "Offense",
        "amount": 10
      },
      {
        "cat": "Utility",
        "amount": 10
      }
    ],
    "stats": [],
    "synergy": []
  },
  {
    "id": "pivotD",
    "name": "Pivot",
    "category": "Defense",
    "description": "Boosts the current lowest module using Defense stacks.",
    "effectDesc": "Increases the lowest module’s stacks using available Defense stacks. Useful in recovery builds.",
    "effectType": "pivot",
    "icon": "🔁",
    "stackChanges": [],
    "stats": [],
    "synergy": []
  },
  {
    "id": "invertD",
    "name": "Invert",
    "category": "Defense",
    "description": "Swap Defense stacks with the current highest module stacks. If Defense stacks are already the highest, or Offense and Utility stacks are tied for highest, nothing happens.",
    "effectDesc": "Swaps Defense stacks with the highest other module. Fails if Defense is already the highest, or if Offense and Utility are tied for highest.",
    "effectType": "invert",
    "icon": "🔀",
    "stackChanges": [],
    "stats": [],
    "synergy": []
  },
  {
    "id": "stabilizeD",
    "name": "Stabilize",
    "category": "Defense",
    "description": "Defense stacks are locked and cannot change.",
    "effectDesc": "Defense stacks are frozen at their current value; all subsequent changes to Defense stacks are ignored.",
    "effectType": "stabilize",
    "icon": "🔒",
    "stackChanges": [],
    "stats": [],
    "synergy": [
      "amplifyD",
      "consumeD"
    ]
  },
  {
    "id": "amplifyU",
    "name": "Amplify",
    "category": "Utility",
    "description": "Adds 5 Utility stacks with no change to contribution type.",
    "effectDesc": "No change to stat type",
    "effectType": "none",
    "icon": "📈",
    "stackChanges": [
      {
        "cat": "Utility",
        "amount": 5
      }
    ],
    "stats": [
      {
        "stat": "skillDamage",
        "base": 5,
        "synergy": 1
      }
    ],
    "synergy": [
      "compressU",
      "convert1U",
      "convert2U"
    ]
  },
  {
    "id": "consumeU",
    "name": "Consume",
    "category": "Utility",
    "description": "Gains 10 Utility stacks by consuming 5 Offense and 5 Defense stacks.",
    "effectDesc": "No change to stat type",
    "effectType": "none",
    "icon": "🔄",
    "stackChanges": [
      {
        "cat": "Utility",
        "amount": 10
      },
      {
        "cat": "Offense",
        "amount": -5
      },
      {
        "cat": "Defense",
        "amount": -5
      }
    ],
    "stats": [
      {
        "stat": "skillDamage",
        "base": 10,
        "synergy": 2
      }
    ],
    "synergy": [
      "amplifyU",
      "compressU",
      "convert1U",
      "convert2U"
    ]
  },
  {
    "id": "saturateU",
    "name": "Saturate",
    "category": "Utility",
    "description": "Adds 25 Utility stacks, but they no longer contribute to stats.",
    "effectDesc": "Utility stacks stop contributing to stats (still count for other passives)",
    "effectType": "saturate",
    "icon": "💧",
    "stackChanges": [
      {
        "cat": "Utility",
        "amount": 25
      }
    ],
    "stats": [],
    "synergy": [
      "cascade",
      "converge"
    ]
  },
  {
    "id": "compressU",
    "name": "Compress",
    "category": "Utility",
    "description": "Removes 10 Utility stacks, but each remaining stack is 50% more potent.",
    "effectDesc": "Each remaining Utility stack is 50% more potent",
    "effectType": "compress",
    "icon": "🗜️",
    "stackChanges": [
      {
        "cat": "Utility",
        "amount": -10
      }
    ],
    "stats": [
      {
        "stat": "skillDamage",
        "base": 0,
        "synergy": 8
      }
    ],
    "synergy": [
      "amplifyU",
      "consumeU",
      "saturateU",
      "convert1U",
      "convert2U"
    ]
  },
  {
    "id": "convert1U",
    "name": "Convert 1",
    "category": "Utility",
    "description": "Utility stacks now provide Skill Repair at 1% per stack instead of Skill Damage.",
    "effectDesc": "Utility → Skill Repair (1%/stack) instead of Skill Damage",
    "effectType": "convert",
    "icon": "🩹",
    "stackChanges": [],
    "stats": [
      {
        "stat": "skillRepair",
        "base": 20,
        "synergy": 5
      }
    ],
    "synergy": [
      "amplifyU",
      "consumeU",
      "compressU"
    ]
  },
  {
    "id": "convert2U",
    "name": "Convert 2",
    "category": "Utility",
    "description": "Utility stacks now provide Status Effects at 1% per stack instead of Skill Damage.",
    "effectDesc": "Utility → Status Effects (1%/stack) instead of Skill Damage",
    "effectType": "convert",
    "icon": "☣️",
    "stackChanges": [],
    "stats": [
      {
        "stat": "statusEffects",
        "base": 20,
        "synergy": 5
      }
    ],
    "synergy": [
      "amplifyU",
      "consumeU",
      "compressU"
    ]
  },
  {
    "id": "splitU",
    "name": "Split",
    "category": "Utility",
    "description": "Redistributes 15 Utility stacks as 10 Offense and 10 Defense stacks.",
    "effectDesc": "Redistributes stacks",
    "effectType": "redistribute",
    "icon": "↔️",
    "stackChanges": [
      {
        "cat": "Utility",
        "amount": -15
      },
      {
        "cat": "Offense",
        "amount": 10
      },
      {
        "cat": "Defense",
        "amount": 10
      }
    ],
    "stats": [],
    "synergy": []
  },
  {
    "id": "pivotU",
    "name": "Pivot",
    "category": "Utility",
    "description": "Boosts the current lowest module by increasing whichever module is currently the lowest.",
    "effectDesc": "Increases whichever module is currently the lowest",
    "effectType": "pivot",
    "icon": "🔃",
    "stackChanges": [],
    "stats": [],
    "synergy": []
  },
  {
    "id": "invertU",
    "name": "Invert",
    "category": "Utility",
    "description": "Swap Utility stacks with the current highest module stacks. If Utility stacks are already the highest, or Offense and Defense stacks are tied for highest, nothing happens.",
    "effectDesc": "Swaps Utility stacks with the highest other module. Fails if Utility is already the highest, or if Offense and Defense are tied for highest.",
    "effectType": "invert",
    "icon": "🔀",
    "stackChanges": [],
    "stats": [],
    "synergy": []
  },
  {
    "id": "stabilizeU",
    "name": "Stabilize",
    "category": "Utility",
    "description": "Utility stacks are locked and cannot change.",
    "effectDesc": "Utility stacks are frozen at their current value; all subsequent changes to Utility stacks are ignored.",
    "effectType": "stabilize",
    "icon": "🔒",
    "stackChanges": [],
    "stats": [],
    "synergy": [
      "amplifyU",
      "consumeU"
    ]
  },
  {
    "id": "nullify",
    "name": "Nullify",
    "category": "Wildcard",
    "description": "Reverses all previous value changes on the lowest module — additions become subtractions and vice-versa.",
    "effectDesc": "Reverses additions/subtractions on the lowest stack module. Fails if two or more modules are tied for lowest. Invert passives are unaffected.",
    "effectType": "nullify",
    "icon": "↩️",
    "stackChanges": [],
    "stats": [],
    "synergy": [
      "compress",
      "convert1",
      "convert2"
    ]
  },
  {
    "id": "cascade",
    "name": "Cascade",
    "category": "Wildcard",
    "description": "Disables the highest module’s stacks, then splits half its value (rounded up) equally into the other two modules.",
    "effectDesc": "Highest module’s stacks stop contributing; +⌈highest/2⌉ stacks added to each other two modules. Fails if two or more tied for highest.",
    "effectType": "cascade",
    "icon": "🌀",
    "stackChanges": [],
    "stats": [],
    "synergy": [
      "amplify",
      "consume"
    ]
  },
  {
    "id": "converge",
    "name": "Converge",
    "category": "Wildcard",
    "description": "The lowest module gains the average of the other two modules’ stacks; the other two are then reduced to 0.",
    "effectDesc": "Lowest module = average of the other two, then the other two drop to 0. Fails if two or more tied for lowest.",
    "effectType": "converge",
    "icon": "➡️",
    "stackChanges": [],
    "stats": [],
    "synergy": [
      "amplify",
      "consume",
      "saturate"
    ]
  },
  {
    "id": "equalize",
    "name": "Equalize",
    "category": "Wildcard",
    "description": "All three modules become equal to the middle stack value.",
    "effectDesc": "All modules set to the median stack count. Fails if the middle value is tied with the highest or lowest.",
    "effectType": "equalize",
    "icon": "⚖️",
    "stackChanges": [],
    "stats": [],
    "synergy": []
  }
];