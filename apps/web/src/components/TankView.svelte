<script lang="ts">
  import { lang as langState } from '../lang-state.svelte.js';

  let lang = $derived(langState.current);

  let totalArmor = $state(1500000);
  let armorBonus = $state(30);
  let healthBonus = $state(15);
  let protectionFromElites = $state(10);
  let incomingRepair = $state(20);
  let armorOnKill = $state(5);
  let enemyDmg = $state(100000); // base enemy dmg per hit at Heroic

  // Formulas from attribute_dictionary (hunter pipeline):
  // - Armor mitigation cap: 70%
  // - Physical damage mitigation cap: 90%
  // - Protection from elites: reduces damage from elites
  let effectiveArmor = $derived(totalArmor * (1 + armorBonus / 100));
  let effectiveHealth = $derived(Math.round(1000000 * (1 + healthBonus / 100))); // 1M base player HP
  // Simplified armor mitigation: capped at 70%
  let armorMitigationPct = $derived(Math.min(70, (effectiveArmor / (effectiveArmor + 10000000)) * 100));
  let effectiveDmgTaken = $derived(enemyDmg * (1 - armorMitigationPct / 100) * (1 - protectionFromElites / 100));
  let timeToDieArmor = $derived(enemyDmg > 0 ? effectiveArmor / effectiveDmgTaken : Infinity);
  let timeToDieTotal = $derived(enemyDmg > 0 ? (effectiveArmor + effectiveHealth) / effectiveDmgTaken : Infinity);

  function fmt(n: number): string {
    return Math.round(n).toLocaleString(lang === 'ru' ? 'ru' : 'en');
  }
  function fmtTime(s: number): string {
    if (!isFinite(s)) return '∞';
    if (s < 1) return (s * 1000).toFixed(0) + 'ms';
    return s.toFixed(1) + 's';
  }
</script>

<section class="panel tank-header">
  <div class="panel-title">
    <span>🛡 {lang === 'ru' ? 'Калькулятор танка' : 'Tank Calculator'}</span>
  </div>
  <div class="intro">
    {lang === 'ru' ? 'Оценка time-to-die под огнём. Капы: броня 70%, физ. урон 90%, DoT 90%.' : 'Estimate time-to-die under enemy fire. Caps: armor mitigation 70%, physical 90%, DoT 90%.'}
  </div>
</section>

<section class="panel tank-inputs">
  <div class="panel-title"><span>{lang === 'ru' ? 'Статы танка' : 'Tank Stats'}</span></div>
  <div class="grid">
    <label>
      <span>💙 {lang === 'ru' ? 'Всего брони' : 'Total Armor'}</span>
      <input class="input num" type="number" bind:value={totalArmor} />
    </label>
    <label>
      <span>🛡 {lang === 'ru' ? 'Броня %' : 'Armor %'}</span>
      <input class="input num" type="number" bind:value={armorBonus} />
    </label>
    <label>
      <span>❤ {lang === 'ru' ? 'Здоровье %' : 'Health %'}</span>
      <input class="input num" type="number" bind:value={healthBonus} />
    </label>
    <label>
      <span>🏅 {lang === 'ru' ? 'Защита от элиты %' : 'Protection from Elites %'}</span>
      <input class="input num" type="number" max="50" bind:value={protectionFromElites} />
    </label>
    <label>
      <span>⚕ {lang === 'ru' ? 'Ремонт %' : 'Incoming Repair %'}</span>
      <input class="input num" type="number" bind:value={incomingRepair} />
    </label>
    <label>
      <span>🎯 {lang === 'ru' ? 'Броня за убийство %' : 'Armor on Kill %'}</span>
      <input class="input num" type="number" bind:value={armorOnKill} />
    </label>
    <label>
      <span>💢 {lang === 'ru' ? 'Урон врага/выстрел' : 'Enemy Damage/hit'}</span>
      <input class="input num" type="number" bind:value={enemyDmg} />
    </label>
  </div>
</section>

<section class="panel tank-results">
  <div class="panel-title"><span>{lang === 'ru' ? 'Результат' : 'Results'}</span></div>
  <div class="metrics-grid">
    <div class="m primary">
      <div class="v num">{fmt(effectiveArmor)}</div>
      <div class="l">{lang === 'ru' ? 'Эффективная броня' : 'Effective Armor'}</div>
    </div>
    <div class="m">
      <div class="v num">{fmt(effectiveHealth)}</div>
      <div class="l">{lang === 'ru' ? 'Эффективное здоровье' : 'Effective Health'}</div>
    </div>
    <div class="m">
      <div class="v num">{armorMitigationPct.toFixed(1)}%</div>
      <div class="l">{lang === 'ru' ? 'Снижение урона бронёй' : 'Armor Mitigation'}</div>
    </div>
    <div class="m">
      <div class="v num">{fmt(effectiveDmgTaken)}</div>
      <div class="l">{lang === 'ru' ? 'Фактический урон/выстрел' : 'Actual Dmg Taken/hit'}</div>
    </div>
    <div class="m">
      <div class="v num">{fmtTime(timeToDieArmor)}</div>
      <div class="l">{lang === 'ru' ? 'Время до пробития брони' : 'Armor break time'}</div>
    </div>
    <div class="m primary">
      <div class="v num">{fmtTime(timeToDieTotal)}</div>
      <div class="l">{lang === 'ru' ? 'Полное TTD' : 'Total TTD'}</div>
    </div>
  </div>
  <div class="note">
    {lang === 'ru' ? 'Упрощённо. Реальное снижение зависит от уровня врага, типа урона, сопротивления DoT.' : 'Simplified. Real mitigation depends on enemy level, damage type, DoT resistance.'}
  </div>
</section>

<style>
  section.panel { max-width: 1100px; margin: 0 auto 12px; }
  .intro { color: var(--text-dim); font-size: 12px; line-height: 1.4; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 8px; }
  label { display: flex; flex-direction: column; gap: 4px; }
  label span { font: 700 10px/1 var(--f-display); color: var(--muted); letter-spacing: .1em; text-transform: uppercase; }
  .input.num { padding: 6px 10px; }
  .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 6px; }
  .m { padding: 12px; background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--r); text-align: center; }
  .m.primary { border-color: rgba(88,169,255,.5); background: radial-gradient(circle at 50% 0%, rgba(88,169,255,.1), transparent 70%), var(--bg-2); }
  .m .v { font: 700 18px/1 var(--f-mono); color: var(--text); }
  .m.primary .v { color: var(--blue); font-size: 22px; }
  .m .l { font: 700 9px/1 var(--f-display); color: var(--muted); margin-top: 6px; letter-spacing: .12em; text-transform: uppercase; }
  .note { margin-top: 10px; font-size: 11px; color: var(--muted); font-style: italic; }
</style>
