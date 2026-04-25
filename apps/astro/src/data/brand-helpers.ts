import brandsRaw from './brands.json';

export interface BrandBonus {
  pieces: number;
  bonus: { stat: string; value: number };
}

export interface Brand {
  id: string;
  bonuses: BrandBonus[];
  core?: string;
  dlc?: string | null;
}

const data = brandsRaw as { version: string; gameVersion: string; brands: Brand[] };
export const BRANDS: Brand[] = data.brands;

export function brandSlug(id: string): string {
  return id.toLowerCase().replace(/_s_/g, 's-').replace(/_s$/, 's').replace(/_/g, '-');
}
const slugMap = new Map<string, string>();
for (const b of BRANDS) slugMap.set(brandSlug(b.id), b.id);
export function brandIdFromSlug(slug: string): string | undefined { return slugMap.get(slug); }

export function brandName(b: Brand): string {
  const overrides: Record<string, string> = {
    '5_11_tactical': '5.11 Tactical',
    'china_light_industries_corporation': 'China Light Industries Corp.',
    ceska_vyroba_s_r_o: 'Česká Výroba s.r.o.',
    grupo_sombra_s_a: 'Grupo Sombra S.A.',
    sokolov_concern: 'Sokolov Concern',
    walker_harris_co: 'Walker, Harris & Co.',
    zwiadowka_sp_z_o_o: 'Zwiadowka Sp. z o.o.',
  };
  return overrides[b.id] || b.id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
