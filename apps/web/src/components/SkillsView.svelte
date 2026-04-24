<script lang="ts">
  import { i18next } from '../i18n.js';
  import { t, lang as langState } from '../lang-state.svelte.js';

  let lang = $derived(langState.current);
  const numLocale = $derived(lang === 'ru' ? 'ru' : 'en');

  let skillsRaw = $state<Array<Record<string, unknown>> | null>(null);
  let utilitySkills = $state<Array<Record<string, unknown>>>([]);
  let err = $state<string | null>(null);

  let tier = $state(6);
  let sdmgPct = $state(0);
  let statusPct = $state(0);
  let haste = $state(0);
  let filter = $state<'all' | 'drone' | 'turret' | 'hive' | 'seeker' | 'firefly' | 'chem' | 'pulse'>('all');

  $effect(() => {
    fetch('/data/skills.json')
      .then((r) => r.ok ? r.json() : null)
      .then((j) => {
        skillsRaw = (j?.skills as Array<Record<string, unknown>>) || [];
      })
      .catch((e) => (err = String(e)));
    fetch('/data/utility-skills.json')
      .then((r) => r.ok ? r.json() : [])
      .then((j) => { utilitySkills = Array.isArray(j) ? j : []; })
      .catch(() => { utilitySkills = []; });
  });

  function fmt(n: number): string {
    return Math.round(n).toLocaleString(numLocale);
  }

  function skillName(s: Record<string, unknown>): string {
    return (lang === 'en' ? (s.name_en as string) : (s.name_ru as string)) || (s.name_en as string) || '?';
  }
  function skillDesc(s: Record<string, unknown>): string {
    return (lang === 'en' ? (s.desc_en as string) : (s.desc_ru as string)) || '';
  }

  interface SkillRow {
    s: Record<string, unknown>;
    typeIcon: string;
    dpsActive: number;
    dpsAvg: number;
    dmgPerShot: number;
    totalDmg: number;
    cdFinal: number;
    dur: number;
    category: string;
  }

  let rows = $derived.by<SkillRow[]>(() => {
    if (!skillsRaw) return [];
    const sdMul = 1 + sdmgPct / 100;
    const s = skillsRaw as Array<Record<string, unknown> & {
      type?: string;
      category?: string;
      base_dmg_per_shot?: number;
      base_dmg_per_drone?: number;
      rpm?: number;
      duration_s?: number;
      cooldown_s?: number;
      tier_dmg_mult?: Record<number, number>;
      tier_cd_mult?: Record<number, number>;
      tier_dur_mult?: Record<number, number>;
      tier_drones_mult?: Record<number, number>;
      drones_total?: number;
      max_targets?: number;
      amp_to_marked?: number;
    }>;
    return s
      .filter((sk) => filter === 'all' || sk.type === filter)
      .map((sk) => {
        const tierMul = sk.tier_dmg_mult?.[tier] ?? 1;
        const durMul = sk.tier_dur_mult?.[tier] ?? 1;
        const cdMul = sk.tier_cd_mult?.[tier] ?? 1;
        const cdFinal = (sk.cooldown_s ?? 0) * cdMul / (1 + haste / 100);
        let dpsActive = 0, dpsAvg = 0, dmgPerShot = 0, totalDmg = 0, dur = sk.duration_s ?? 60;
        dur = dur * durMul;

        const skAny = sk as Record<string, unknown> & {
          base_dmg_per_bomb?: number;
          bombs_per_run?: number;
          base_dmg_per_shell?: number;
          shells_per_run?: number;
          base_dmg_per_pulse?: number;
          pulses_per_burst?: number;
          base_dmg_per_explosion?: number;
          base_dmg?: number;
          base_dmg_per_tick?: number;
          tick_rate?: number;
          ticks_per_sec?: number;
          base_dmg_per_mine?: number;
          mines_per_use?: number;
          mines_per_charge?: number;
          base_dmg_per_target?: number;
          targets_total?: number;
          max_targets?: number;
        };

        if (sk.base_dmg_per_shot && sk.rpm) {
          dmgPerShot = sk.base_dmg_per_shot * tierMul * sdMul;
          const sps = sk.rpm / 60;
          dpsActive = dmgPerShot * sps;
          totalDmg = dpsActive * dur;
          dpsAvg = totalDmg / (dur + cdFinal);
        } else if (sk.base_dmg_per_drone) {
          const dronesMul = sk.tier_drones_mult?.[tier] ?? 1;
          const drones = (sk.drones_total ?? 1) * dronesMul;
          dmgPerShot = sk.base_dmg_per_drone * tierMul * sdMul;
          totalDmg = dmgPerShot * drones;
          dpsAvg = totalDmg / (dur + cdFinal);
        } else if (skAny.base_dmg_per_bomb) {
          const bombs = skAny.bombs_per_run ?? 1;
          dmgPerShot = skAny.base_dmg_per_bomb * tierMul * sdMul;
          totalDmg = dmgPerShot * bombs;
          dpsAvg = totalDmg / (dur + cdFinal);
        } else if (skAny.base_dmg_per_shell) {
          const shells = skAny.shells_per_run ?? 1;
          dmgPerShot = skAny.base_dmg_per_shell * tierMul * sdMul;
          totalDmg = dmgPerShot * shells;
          dpsAvg = totalDmg / (dur + cdFinal);
        } else if (skAny.base_dmg_per_pulse) {
          dmgPerShot = skAny.base_dmg_per_pulse * tierMul * sdMul;
          const pulses = skAny.pulses_per_burst ?? 1;
          totalDmg = dmgPerShot * pulses;
          dpsAvg = totalDmg / (dur + cdFinal);
        } else if (skAny.base_dmg_per_tick) {
          const tps = skAny.ticks_per_sec ?? skAny.tick_rate ?? 1;
          dmgPerShot = skAny.base_dmg_per_tick * tierMul * sdMul;
          dpsActive = dmgPerShot * tps;
          totalDmg = dpsActive * dur;
          dpsAvg = totalDmg / (dur + cdFinal);
        } else if (skAny.base_dmg_per_mine) {
          const mines = skAny.mines_per_charge ?? skAny.mines_per_use ?? 1;
          dmgPerShot = skAny.base_dmg_per_mine * tierMul * sdMul;
          totalDmg = dmgPerShot * mines;
          dpsAvg = totalDmg / Math.max(1, cdFinal);
        } else if (skAny.base_dmg_per_target) {
          const targets = skAny.targets_total ?? skAny.max_targets ?? 1;
          dmgPerShot = skAny.base_dmg_per_target * tierMul * sdMul;
          totalDmg = dmgPerShot * targets;
          dpsAvg = totalDmg / Math.max(1, cdFinal);
        } else if (skAny.base_dmg_per_explosion ?? skAny.base_dmg) {
          const single = (skAny.base_dmg_per_explosion ?? skAny.base_dmg ?? 0);
          dmgPerShot = single * tierMul * sdMul;
          totalDmg = dmgPerShot;
          dpsAvg = totalDmg / Math.max(1, cdFinal);
        }

        const typeIcon = { drone: '🛸', turret: '🔫', hive: '🐝', seeker: '💣', firefly: '✨', chem: '🧪', pulse: '📡' }[(sk.type as string) || ''] ?? '⚡';
        return {
          s: sk,
          typeIcon,
          dpsActive,
          dpsAvg,
          dmgPerShot,
          totalDmg,
          cdFinal,
          dur,
          category: (sk.category as string) ?? 'dps',
        };
      });
  });

  const FILTERS = $derived<Array<{ id: typeof filter; label: string; icon: string }>>(
    lang === 'ru'
      ? [
          { id: 'all', icon: '⚡', label: 'Все' },
          { id: 'drone', icon: '🛸', label: 'Дрон' },
          { id: 'turret', icon: '🔫', label: 'Турель' },
          { id: 'hive', icon: '🐝', label: 'Улей' },
          { id: 'seeker', icon: '💣', label: 'Искатель' },
          { id: 'firefly', icon: '✨', label: 'Светлячок' },
          { id: 'chem', icon: '🧪', label: 'Хим.пуск' },
          { id: 'pulse', icon: '📡', label: 'Импульс' },
        ]
      : [
          { id: 'all', icon: '⚡', label: 'All' },
          { id: 'drone', icon: '🛸', label: 'Drone' },
          { id: 'turret', icon: '🔫', label: 'Turret' },
          { id: 'hive', icon: '🐝', label: 'Hive' },
          { id: 'seeker', icon: '💣', label: 'Seeker' },
          { id: 'firefly', icon: '✨', label: 'Firefly' },
          { id: 'chem', icon: '🧪', label: 'Chem' },
          { id: 'pulse', icon: '📡', label: 'Pulse' },
        ]
  );
</script>

<section class="panel sk-inputs">
  <div class="panel-title"><span>{lang === 'ru' ? 'Параметры билда навыков' : 'Skill Build Params'}</span></div>
  <div class="inputs-grid">
    <label>
      <span>{lang === 'ru' ? 'Уровень навыков (0-6)' : 'Skill Tier (0-6)'}</span>
      <input class="input num" type="number" min="0" max="6" bind:value={tier} />
    </label>
    <label>
      <span>{lang === 'ru' ? 'Урон навыков %' : 'Skill Damage %'}</span>
      <input class="input num" type="number" min="0" max="2000" bind:value={sdmgPct} />
    </label>
    <label>
      <span>{lang === 'ru' ? 'Ускорение навыков %' : 'Skill Haste %'}</span>
      <input class="input num" type="number" min="0" max="500" bind:value={haste} />
    </label>
    <label>
      <span>{lang === 'ru' ? 'Эффекты статусов %' : 'Status %'}</span>
      <input class="input num" type="number" min="0" max="500" bind:value={statusPct} />
    </label>
  </div>
</section>

<section class="panel sk-filters">
  <div class="chip-row">
    {#each FILTERS as f (f.id)}
      <button class="btn small" class:active={filter === f.id} onclick={() => (filter = f.id)}>
        {f.icon} {f.label}
      </button>
    {/each}
  </div>
</section>

{#if err}
  <div class="status error">{err}</div>
{:else if !skillsRaw}
  <div class="status">{lang === 'ru' ? 'Загрузка…' : 'Loading…'}</div>
{:else}
  <div class="skill-list">
    {#each rows as r (r.s.name_en ?? r.s.id ?? Math.random())}
      <div class="sk-card">
        <div class="sk-head">
          <span class="sk-ico">{r.typeIcon}</span>
          <span class="sk-name">{skillName(r.s)}</span>
          <span class="sk-tier">T{tier}</span>
        </div>
        <div class="sk-metrics">
          {#if r.dpsActive > 0}
            <div class="sm primary">
              <div class="v num">{fmt(r.dpsActive)}</div>
              <div class="l">{lang === 'ru' ? 'DPS активный' : 'Active DPS'}</div>
            </div>
            <div class="sm">
              <div class="v num">{fmt(r.dpsAvg)}</div>
              <div class="l">{lang === 'ru' ? 'DPS средний (КД)' : 'Avg DPS (w/ CD)'}</div>
            </div>
          {:else}
            <div class="sm primary">
              <div class="v num">{fmt(r.totalDmg)}</div>
              <div class="l">{lang === 'ru' ? 'Полный урон' : 'Total damage'}</div>
            </div>
            <div class="sm">
              <div class="v num">{fmt(r.dpsAvg)}</div>
              <div class="l">{lang === 'ru' ? 'DPS средний' : 'Avg DPS'}</div>
            </div>
          {/if}
        </div>
        <div class="sk-meta num">
          {lang === 'ru' ? 'Урон/выстрел' : 'Dmg/shot'}: <b>{fmt(r.dmgPerShot)}</b>
          {#if r.s.rpm}· RPM: {r.s.rpm}{/if}
          · {lang === 'ru' ? 'Длит' : 'Dur'}: {r.dur.toFixed(1)}s
          · CD: {r.cdFinal.toFixed(1)}s
        </div>
        <div class="sk-desc">{skillDesc(r.s)}</div>
      </div>
    {/each}
  </div>
{/if}

{#if utilitySkills.length > 0}
  <section class="panel util-header">
    <div class="panel-title"><span>🛡 {lang === 'ru' ? 'Скиллы поддержки (хил/щит)' : 'Utility Skills (healing/shield)'}</span></div>
  </section>
  <div class="util-list">
    {#each utilitySkills as u, i (i)}
      {@const name = lang === 'en' ? (u.name_en as string) : (u.name_ru as string)}
      <div class="util-card">
        <div class="util-head">
          <span class="util-name">{name || '?'}</span>
          {#if u.category}<span class="util-tag">{u.category}</span>{/if}
        </div>
        <div class="util-meta num">
          {#if u.health}❤ {Math.round((u.health as number) * (1 + tier * 0.15)).toLocaleString()}{/if}
          {#if u.base_heal}💚 {Math.round((u.base_heal as number) * (1 + tier * 0.15) * (1 + sdmgPct / 100)).toLocaleString()}/s{/if}
          {#if u.armor_restore_pct}🛡 +{((u.armor_restore_pct as number) * 100).toFixed(0)}% {lang === 'ru' ? 'брони' : 'armor'}{/if}
          {#if u.charges}· {u.charges} {lang === 'ru' ? 'зарядов' : 'charges'}{/if}
          {#if u.cooldown}· {lang === 'ru' ? 'КД' : 'CD'} {u.cooldown}s{/if}
        </div>
        <div class="util-desc">{lang === 'en' ? (u.desc_en as string) || '' : (u.desc_ru as string) || ''}</div>
      </div>
    {/each}
  </div>
{/if}

<style>
  .util-header { max-width: 1400px; margin: 16px auto 8px; }
  .util-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 8px; max-width: 1400px; margin: 0 auto 14px; }
  .util-card { background: var(--bg-2); border: 1px solid var(--border); border-left: 3px solid var(--green); border-radius: var(--r-sm); padding: 10px 12px; }
  .util-head { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
  .util-name { font: 700 12px/1 var(--f-display); letter-spacing: .04em; color: var(--green); flex: 1; }
  .util-tag { font: 700 9px/1 var(--f-mono); color: var(--muted); background: var(--raised); padding: 2px 6px; border-radius: 3px; }
  .util-meta { font-size: 11px; color: var(--text); margin-bottom: 4px; }
  .util-desc { font-size: 10px; color: var(--muted); font-style: italic; line-height: 1.4; }
  .sk-inputs { max-width: 900px; margin: 0 auto 10px; }
  .inputs-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
  @media (max-width: 700px) { .inputs-grid { grid-template-columns: 1fr 1fr; } }
  .inputs-grid label { display: flex; flex-direction: column; gap: 4px; }
  .inputs-grid label span { font: 700 9px/1 var(--f-display); color: var(--muted); letter-spacing: .12em; text-transform: uppercase; }
  .inputs-grid .input { padding: 6px 10px; font-size: 13px; }

  .sk-filters { max-width: 900px; margin: 0 auto 14px; padding: 10px; }
  .chip-row { display: flex; flex-wrap: wrap; gap: 4px; justify-content: center; }

  .status { padding: 40px; text-align: center; color: var(--muted); font: 700 12px/1 var(--f-display); letter-spacing: .2em; text-transform: uppercase; }
  .status.error { color: var(--red); }

  .skill-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 10px; max-width: 1400px; margin: 0 auto; }
  .sk-card {
    background: var(--card); border: 1px solid var(--border);
    border-left: 3px solid var(--blue);
    border-radius: var(--r);
    padding: 12px;
  }
  .sk-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
  .sk-ico { font-size: 16px; }
  .sk-name { flex: 1; font: 700 13px/1 var(--f-display); letter-spacing: .04em; color: var(--blue); }
  .sk-tier { font: 700 10px/1 var(--f-mono); padding: 3px 8px; background: rgba(66,165,245,.1); border-radius: 999px; color: var(--blue); }
  .sk-metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 6px; }
  .sm { background: var(--bg-2); padding: 8px; border-radius: var(--r-sm); text-align: center; }
  .sm.primary { background: rgba(254,175,16,.08); }
  .sm .v { font: 700 16px/1 var(--f-mono); color: var(--text); }
  .sm.primary .v { color: var(--orange); font-size: 18px; }
  .sm .l { font: 700 8px/1 var(--f-display); color: var(--muted); letter-spacing: .12em; margin-top: 4px; text-transform: uppercase; }
  .sk-meta { font-size: 10px; color: var(--text-dim); line-height: 1.4; margin-bottom: 6px; }
  .sk-desc { font-size: 11px; color: var(--muted); line-height: 1.4; font-style: italic; }
</style>
