export interface EnemyType {
  id: string;
  name: string;
  hp: number;
  armor: number;
}

export interface Difficulty {
  name: string;
  multiplier: number;
  health?: Record<string, Record<string, number>>;
  armor?: Record<string, Record<string, number>>;
  total_hp_armor?: Record<string, Record<string, number>>;
}

export interface EnemyHpData {
  types: EnemyType[];
  difficulties: Difficulty[];
}

let CACHED: EnemyHpData | null = null;

export async function loadEnemyHp(): Promise<EnemyHpData> {
  if (CACHED) return CACHED;
  try {
    const r = await fetch('/data/enemy-hp.json');
    if (!r.ok) return { types: [], difficulties: [] };
    const j = (await r.json()) as EnemyHpData;
    CACHED = j;
    return j;
  } catch {
    return { types: [], difficulties: [] };
  }
}

export function getTotalHpArmor(diff: Difficulty, enemyId: string, playerKey: string): number {
  if (diff.total_hp_armor?.[enemyId]?.[playerKey] !== undefined) {
    return diff.total_hp_armor[enemyId][playerKey];
  }
  const hp = diff.health?.[enemyId]?.[playerKey];
  const ar = diff.armor?.[enemyId]?.[playerKey];
  if (hp !== undefined || ar !== undefined) {
    return (hp ?? 0) + (ar ?? 0);
  }
  return 0;
}
