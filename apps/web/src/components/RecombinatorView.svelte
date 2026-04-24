<script lang="ts">
  import { lang as langState } from '../lang-state.svelte.js';

  let lang = $derived(langState.current);

  interface Mod {
    id: string;
    name: string;
    category: 'Offense' | 'Defense' | 'Utility' | 'Wildcard';
    description: string;
    description_ru?: string;
    effectDesc: string;
    effectDesc_ru?: string;
    effectType: string;
    icon: string;
    stackChanges?: Array<{ cat: string; amount: number }>;
    stats?: Array<{ stat: string; base: number; synergy: number }>;
    synergy?: string[];
  }

  let mods = $state<Mod[]>([]);
  let slots = $state<(string | null)[]>([null, null, null, null, null, null, null, null, null, null]);

  $effect(() => {
    void lang;
    fetch('/data/recombinator-modifiers.json')
      .then((r) => r.ok ? r.json() : [])
      .then((j) => { mods = Array.isArray(j) ? j : []; });
  });

  let stacks = $derived.by(() => {
    const s = { Offense: 0, Defense: 0, Utility: 0 };
    const locked = { Offense: false, Defense: false, Utility: false };
    const saturated = { Offense: false, Defense: false, Utility: false };
    const warnings: string[] = [];
    for (let t = 0; t < 10; t++) {
      const mid = slots[t];
      if (!mid) continue;
      const m = mods.find((x) => x.id === mid);
      if (!m) continue;
      const cat = m.category === 'Wildcard' ? null : m.category;
      const eff = m.effectType;
      if (eff === 'none' || eff === 'saturate' || eff === 'redistribute') {
        for (const sc of m.stackChanges || []) {
          const k = sc.cat as 'Offense' | 'Defense' | 'Utility';
          if (!locked[k]) {
            s[k] = Math.max(0, s[k] + sc.amount);
          }
        }
        if (eff === 'saturate' && cat) saturated[cat as 'Offense' | 'Defense' | 'Utility'] = true;
      } else if (eff === 'stabilize') {
        if (cat) locked[cat as 'Offense' | 'Defense' | 'Utility'] = true;
      } else if (eff === 'compress') {
        if (cat && !locked[cat as 'Offense' | 'Defense' | 'Utility']) {
          const sc = (m.stackChanges || []).find((x) => x.cat === cat);
          if (sc) s[cat as 'Offense' | 'Defense' | 'Utility'] = Math.max(0, s[cat as 'Offense' | 'Defense' | 'Utility'] + sc.amount);
        }
      } else if (eff === 'invert') {
        if (cat) {
          const others = cat === 'Offense' ? ['Defense', 'Utility'] : cat === 'Defense' ? ['Offense', 'Utility'] : ['Offense', 'Defense'];
          const max = Math.max(s[others[0] as 'Offense' | 'Defense' | 'Utility'], s[others[1] as 'Offense' | 'Defense' | 'Utility']);
          if (s[cat as 'Offense' | 'Defense' | 'Utility'] < max) {
            const highKey = s[others[0] as 'Offense' | 'Defense' | 'Utility'] > s[others[1] as 'Offense' | 'Defense' | 'Utility'] ? others[0] : others[1];
            const tmp = s[cat as 'Offense' | 'Defense' | 'Utility'];
            s[cat as 'Offense' | 'Defense' | 'Utility'] = s[highKey as 'Offense' | 'Defense' | 'Utility'];
            s[highKey as 'Offense' | 'Defense' | 'Utility'] = tmp;
          } else {
            warnings.push(`T${t + 1} ${lang === 'ru' ? 'Инверт: не сработал' : 'Invert: no trigger'}`);
          }
        }
      }
    }
    return { s, locked, saturated, warnings };
  });

  function desc(m: Mod): string {
    return lang === 'en' ? m.description : (m.description_ru || m.description);
  }
  function effDesc(m: Mod): string {
    return lang === 'en' ? m.effectDesc : (m.effectDesc_ru || m.effectDesc);
  }
  function setSlot(i: number, v: string | null) {
    slots = slots.map((x, idx) => (idx === i ? v : x));
  }
  function reset() {
    slots = [null, null, null, null, null, null, null, null, null, null];
  }

  let modsByCat = $derived({
    Offense: mods.filter((m) => m.category === 'Offense'),
    Defense: mods.filter((m) => m.category === 'Defense'),
    Utility: mods.filter((m) => m.category === 'Utility'),
    Wildcard: mods.filter((m) => m.category === 'Wildcard'),
  });
</script>

<section class="panel rc-header">
  <div class="panel-title">
    <span>🧬 {lang === 'ru' ? 'Симулятор рекомбинатора' : 'Recombinator Simulator'}</span>
    <button class="btn small danger" onclick={reset}>{lang === 'ru' ? 'Сброс' : 'Reset'}</button>
  </div>
  <div class="intro">
    {lang === 'ru' ? 'Выбери 10 модификаторов по порядку. Эффекты применяются по очереди.' : 'Pick 10 mods in order to simulate final stack counts. Each effect resolves in sequence.'}
  </div>
</section>

<section class="panel rc-stacks">
  <div class="panel-title"><span>{lang === 'ru' ? 'Итоговые стаки' : 'Final Stacks'}</span></div>
  <div class="rc-stacks-grid">
    <div class="rc-stack" data-cat="offense" class:locked={stacks.locked.Offense} class:saturated={stacks.saturated.Offense}>
      <div class="rc-stack-cat">⚔ {lang === 'ru' ? 'Атака' : 'Offense'}</div>
      <div class="rc-stack-val num">{stacks.s.Offense}</div>
      {#if stacks.locked.Offense}<div class="rc-flag">🔒 {lang === 'ru' ? 'заблок.' : 'locked'}</div>{/if}
      {#if stacks.saturated.Offense}<div class="rc-flag">💧 {lang === 'ru' ? 'насыщ.' : 'saturated'}</div>{/if}
    </div>
    <div class="rc-stack" data-cat="defense" class:locked={stacks.locked.Defense} class:saturated={stacks.saturated.Defense}>
      <div class="rc-stack-cat">🛡 {lang === 'ru' ? 'Защита' : 'Defense'}</div>
      <div class="rc-stack-val num">{stacks.s.Defense}</div>
      {#if stacks.locked.Defense}<div class="rc-flag">🔒 {lang === 'ru' ? 'заблок.' : 'locked'}</div>{/if}
      {#if stacks.saturated.Defense}<div class="rc-flag">💧 {lang === 'ru' ? 'насыщ.' : 'saturated'}</div>{/if}
    </div>
    <div class="rc-stack" data-cat="utility" class:locked={stacks.locked.Utility} class:saturated={stacks.saturated.Utility}>
      <div class="rc-stack-cat">⚡ {lang === 'ru' ? 'Навыки' : 'Utility'}</div>
      <div class="rc-stack-val num">{stacks.s.Utility}</div>
      {#if stacks.locked.Utility}<div class="rc-flag">🔒 {lang === 'ru' ? 'заблок.' : 'locked'}</div>{/if}
      {#if stacks.saturated.Utility}<div class="rc-flag">💧 {lang === 'ru' ? 'насыщ.' : 'saturated'}</div>{/if}
    </div>
  </div>
  {#if stacks.warnings.length > 0}
    <div class="rc-warn">
      {#each stacks.warnings as w, i (i)}<div>⚠ {w}</div>{/each}
    </div>
  {/if}
</section>

<section class="panel rc-slots">
  <div class="panel-title"><span>{lang === 'ru' ? 'Слоты модов (T1-T10)' : 'Mod Slots (T1-T10)'}</span></div>
  <div class="rc-slot-grid">
    {#each slots as s, i (i)}
      {@const m = s ? mods.find((x) => x.id === s) : null}
      <div class="rc-slot" data-cat={m?.category.toLowerCase() ?? ''}>
        <div class="rc-slot-title">T{i + 1}</div>
        <select
          class="input"
          value={s ?? ''}
          onchange={(e) => setSlot(i, (e.currentTarget as HTMLSelectElement).value || null)}
        >
          <option value="">—</option>
          <optgroup label={lang === 'ru' ? '⚔ Атака' : '⚔ Offense'}>
            {#each modsByCat.Offense as mo (mo.id)}
              <option value={mo.id}>{mo.icon} {mo.name}</option>
            {/each}
          </optgroup>
          <optgroup label={lang === 'ru' ? '🛡 Защита' : '🛡 Defense'}>
            {#each modsByCat.Defense as mo (mo.id)}
              <option value={mo.id}>{mo.icon} {mo.name}</option>
            {/each}
          </optgroup>
          <optgroup label={lang === 'ru' ? '⚡ Навыки' : '⚡ Utility'}>
            {#each modsByCat.Utility as mo (mo.id)}
              <option value={mo.id}>{mo.icon} {mo.name}</option>
            {/each}
          </optgroup>
          <optgroup label={lang === 'ru' ? '🌀 Универс.' : '🌀 Wildcard'}>
            {#each modsByCat.Wildcard as mo (mo.id)}
              <option value={mo.id}>{mo.icon} {mo.name}</option>
            {/each}
          </optgroup>
        </select>
        {#if m}
          <div class="rc-eff">{effDesc(m)}</div>
        {/if}
      </div>
    {/each}
  </div>
</section>

<section class="panel rc-legend">
  <div class="panel-title"><span>{lang === 'ru' ? 'Справочник модов' : 'Modifier Reference'}</span></div>
  <div class="rc-cats">
    {#each (['Offense', 'Defense', 'Utility', 'Wildcard'] as const) as cat (cat)}
      <div class="rc-cat-block" data-cat={cat.toLowerCase()}>
        <div class="rc-cat-title">{lang === 'ru' ? ({Offense: 'Атака', Defense: 'Защита', Utility: 'Навыки', Wildcard: 'Универсальные'}[cat]) : cat}</div>
        <div class="rc-cat-list">
          {#each modsByCat[cat] as m (m.id)}
            <div class="rc-mod">
              <span class="rc-mod-name">{m.icon} {m.name}</span>
              <span class="rc-mod-desc">{desc(m)}</span>
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</section>

<style>
  section.panel { max-width: 1200px; margin: 0 auto 12px; }
  .intro { font-size: 12px; color: var(--text-dim); line-height: 1.4; }
  .rc-stacks-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .rc-stack { padding: 14px; border-radius: var(--r); text-align: center; border: 1px solid var(--border); background: var(--bg-2); }
  .rc-stack[data-cat="offense"] { border-left: 3px solid var(--red); }
  .rc-stack[data-cat="defense"] { border-left: 3px solid var(--blue); }
  .rc-stack[data-cat="utility"] { border-left: 3px solid #ffd54f; }
  .rc-stack.locked { background: rgba(254,175,16,.08); }
  .rc-stack.saturated { opacity: .6; }
  .rc-stack-cat { font: 700 10px/1 var(--f-display); letter-spacing: .14em; color: var(--muted); text-transform: uppercase; }
  .rc-stack-val { font: 700 36px/1 var(--f-mono); color: var(--text); margin: 8px 0; }
  .rc-stack[data-cat="offense"] .rc-stack-val { color: var(--red); }
  .rc-stack[data-cat="defense"] .rc-stack-val { color: var(--blue); }
  .rc-stack[data-cat="utility"] .rc-stack-val { color: #ffd54f; }
  .rc-flag { font: 700 9px/1 var(--f-mono); color: var(--muted); margin-top: 4px; }
  .rc-warn { margin-top: 10px; padding: 8px 10px; background: rgba(239,83,80,.1); border-left: 3px solid var(--red); border-radius: var(--r-sm); color: var(--red); font-size: 11px; line-height: 1.6; }
  .rc-slot-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 6px; }
  .rc-slot { padding: 8px; background: var(--bg-2); border: 1px solid var(--border); border-left: 3px solid var(--border); border-radius: var(--r-sm); }
  .rc-slot[data-cat="offense"] { border-left-color: var(--red); }
  .rc-slot[data-cat="defense"] { border-left-color: var(--blue); }
  .rc-slot[data-cat="utility"] { border-left-color: #ffd54f; }
  .rc-slot[data-cat="wildcard"] { border-left-color: #ce93d8; }
  .rc-slot-title { font: 700 10px/1 var(--f-display); color: var(--orange); letter-spacing: .1em; text-transform: uppercase; margin-bottom: 4px; }
  .rc-slot .input { padding: 5px 6px; font-size: 11px; width: 100%; }
  .rc-eff { margin-top: 4px; font-size: 10px; color: var(--text-dim); line-height: 1.3; }
  .rc-cats { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px; }
  .rc-cat-block { padding: 10px; background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--r-sm); border-left: 3px solid var(--border); }
  .rc-cat-block[data-cat="offense"] { border-left-color: var(--red); }
  .rc-cat-block[data-cat="defense"] { border-left-color: var(--blue); }
  .rc-cat-block[data-cat="utility"] { border-left-color: #ffd54f; }
  .rc-cat-block[data-cat="wildcard"] { border-left-color: #ce93d8; }
  .rc-cat-title { font: 700 11px/1 var(--f-display); color: var(--orange); letter-spacing: .12em; text-transform: uppercase; margin-bottom: 8px; }
  .rc-mod { margin-bottom: 8px; font-size: 11px; }
  .rc-mod-name { display: block; font-weight: 600; color: var(--text); margin-bottom: 2px; }
  .rc-mod-desc { display: block; color: var(--muted); line-height: 1.3; }
</style>
