<script lang="ts">
  import { calculateDps, type DpsInput } from '@divcalc/formulas';

  let input: DpsInput = $state({
    weapon: { baseDamage: 100_000, rpm: 600, magazine: 30, reloadSeconds: 2, headshotMultiplier: 1.5 },
    additive: { weaponDamagePct: 30, weaponTypeDamagePct: 15, additiveTalentsPct: 0 },
    amplified: { multipliers: [] },
    crit: { chcPct: 60, chdPct: 180, hsdPct: 100, headshotChancePct: 30 },
    target: { damageToArmorPct: 21, damageToHealthPct: 0, damageOutOfCoverPct: 0 },
    expertise: { grade: 10 },
  });

  let result = $derived(calculateDps(input));
</script>

<main>
  <h1>divcalc.xyz — v2 alpha</h1>
  <p>Skeleton only. Formulas: <code>@divcalc/formulas</code>. Data: <code>@divcalc/data</code>.</p>

  <section>
    <h2>Quick DPS check</h2>
    <label>Base damage <input type="number" bind:value={input.weapon.baseDamage} /></label>
    <label>RPM <input type="number" bind:value={input.weapon.rpm} /></label>
    <label>Magazine <input type="number" bind:value={input.weapon.magazine} /></label>
    <label>Reload (s) <input type="number" step="0.1" bind:value={input.weapon.reloadSeconds} /></label>
    <label>WD% <input type="number" bind:value={input.additive.weaponDamagePct} /></label>
    <label>CHC% <input type="number" bind:value={input.crit.chcPct} /></label>
    <label>CHD% <input type="number" bind:value={input.crit.chdPct} /></label>

    <div class="result">
      <div><b>Bullet:</b> {Math.round(result.bulletDamage).toLocaleString()}</div>
      <div><b>Burst DPS:</b> {Math.round(result.burstDps).toLocaleString()}</div>
      <div><b>Sustained DPS:</b> {Math.round(result.sustainedDps).toLocaleString()}</div>
      <div><b>Cycle:</b> {result.cycleSeconds.toFixed(2)}s</div>
    </div>
  </section>
</main>

<style>
  main { max-width: 900px; margin: 2rem auto; padding: 0 1rem; font-family: system-ui, sans-serif; color: #e8e8e8; }
  h1 { color: #e8a33a; }
  section { background: #151515; border: 1px solid #333; border-radius: 8px; padding: 1rem; margin-top: 1rem; }
  label { display: inline-block; margin: .25rem .5rem .25rem 0; }
  input { width: 100px; padding: .25rem .5rem; background: #222; color: #e8e8e8; border: 1px solid #444; border-radius: 4px; }
  .result { margin-top: 1rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: .5rem; }
  .result div { padding: .5rem .75rem; background: #1e1e1e; border-radius: 4px; }
  :global(body) { margin: 0; background: #0b0b0b; }
</style>
