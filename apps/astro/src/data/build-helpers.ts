import buildsRaw from './meta-builds.json';

export interface MetaBuild {
  id: string;
  name_en?: string;
  name_ru?: string;
  tag_en?: string;
  tag_ru?: string;
  description_en?: string;
  description_ru?: string;
  wpn_en?: string;
  weapon_cat?: string;
  set_focus?: string;
  tier?: 'S' | 'A' | 'B' | 'C';
  expected_dps_peak_m?: number;
  buildConfig?: object;
}

export const META_BUILDS: MetaBuild[] = buildsRaw as MetaBuild[];

export function buildSlug(id: string): string {
  return id.toLowerCase().replace(/_/g, '-');
}
const slugMap = new Map<string, string>();
for (const b of META_BUILDS) slugMap.set(buildSlug(b.id), b.id);
export function buildIdFromSlug(slug: string): string | undefined { return slugMap.get(slug); }
