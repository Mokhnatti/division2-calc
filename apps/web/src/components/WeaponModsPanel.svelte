<script lang="ts">
  import { MOD_SLOTS, modsForSlot, WEAPON_MODS, type ModSlot } from '../data/weapon-mods.js';
  import { i18next } from '../i18n.js';
  import { lang as langState } from '../lang-state.svelte.js';

  interface Props {
    mods: Record<ModSlot, string | null>;
    onPick: (slot: ModSlot, id: string | null) => void;
    available: ModSlot[];
    weaponCategory?: string;
  }

  let { mods, onPick, available, weaponCategory }: Props = $props();
  let lang = $derived(langState.current);

  function modsFiltered(slot: ModSlot) {
    const all = WEAPON_MODS.filter((m) => m.slot === slot);
    if (!weaponCategory) return all;
    return all.filter((m) => {
      const cls = (m as { weaponClasses?: string[] }).weaponClasses;
      if (!cls || cls.length === 0) return true;
      return cls.includes(weaponCategory);
    });
  }

  const SLOT_LABELS: Record<ModSlot, { icon: string; ruLabel: string; enLabel: string }> = {
    optic: { icon: '🔭', ruLabel: 'Прицел', enLabel: 'Optic' },
    muzzle: { icon: '⬛', ruLabel: 'Дульная', enLabel: 'Muzzle' },
    underbarrel: { icon: '▐', ruLabel: 'Подствол', enLabel: 'Underbarrel' },
    magazine: { icon: '🔫', ruLabel: 'Магазин', enLabel: 'Magazine' },
  };

  let slotsAvailable = $derived(new Set(available));

  function label(slot: ModSlot): string {
    return langState.current === 'en' ? SLOT_LABELS[slot].enLabel : SLOT_LABELS[slot].ruLabel;
  }
</script>

<section class="panel wm">
  <div class="panel-title"><span>{langState.current === 'ru' ? 'Моды оружия' : 'Weapon Mods'}</span></div>

  {#each MOD_SLOTS as slot (slot)}
    {@const modList = modsFiltered(slot)}
    <div class="row" class:na={!slotsAvailable.has(slot)}>
      <div class="slot-lbl">
        <span class="ico">{SLOT_LABELS[slot].icon}</span>
        <span>{label(slot)}</span>
      </div>
      <select
        class="input"
        value={mods[slot] ?? ''}
        disabled={!slotsAvailable.has(slot)}
        onchange={(e) => onPick(slot, (e.currentTarget as HTMLSelectElement).value || null)}
      >
        <option value="">— —</option>
        {#each modList as m (m.id)}
          {@const modName = i18next.t(m.id, { ns: 'weapon-mods', defaultValue: m.id }) as string}
          <option value={m.id}>{modName}{m.stat && m.value ? ` (${m.value > 0 ? '+' : ''}${m.value}% ${m.stat.toUpperCase()})` : ''}</option>
        {/each}
      </select>
    </div>
  {/each}
</section>

<style>
  .wm { margin-top: 8px; }
  .row { display: grid; grid-template-columns: 90px 1fr; gap: 6px; align-items: center; margin-bottom: 4px; }
  .row.na { opacity: .4; }
  .slot-lbl { display: flex; align-items: center; gap: 4px; font: 700 10px/1 var(--f-display); letter-spacing: .1em; text-transform: uppercase; color: var(--orange); }
  .ico { font-size: 11px; }
  .input { padding: 5px 8px; font-size: 11px; }
</style>
