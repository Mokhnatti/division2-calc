<script lang="ts">
  import { lang as langState } from '../lang-state.svelte.js';
  let lang = $derived(langState.current);
</script>

<section class="panel f-header">
  <div class="panel-title">
    <span>{lang === 'en' ? 'DPS Formula Reference' : 'Справочник формул DPS'}</span>
  </div>
  <div class="intro">
    {lang === 'en'
      ? 'Based on s-i-n.co.uk community canonical formula (Division 2, Y8S1, 2026).'
      : 'Основано на каноничной формуле сообщества s-i-n.co.uk (Division 2, Y8S1, 2026).'}
  </div>
</section>

<section class="panel f-main">
  <div class="panel-title"><span>{lang === 'en' ? 'Master formula' : 'Главная формула'}</span></div>
  <pre class="formula">Final Damage = Base Weapon Damage
  × (1 + WeaponDmg% + WeaponTypeDmg%)              {#if lang === 'en'}// additive core{:else}// аддитивное ядро{/if}
  × (1 + Σ additive talents)                       {#if lang === 'en'}// Vigilance + Composure + Obliterate + Focus...{:else}// Vigilance + Composure + Obliterate + Focus...{/if}
  × (1 + Amp1) × (1 + Amp2) × (1 + Amp3)           {#if lang === 'en'}// Glass Cannon, Spotter, Wicked — multiply separately{:else}// Glass Cannon, Spotter, Wicked — перемножаются{/if}
  × (1 + CHC × CHD + HS_chance × HSD)              {#if lang === 'en'}// crit + headshot bracket{:else}// крит + хедшот{/if}
  × (1 + DtArmor or DtHealth)                      {#if lang === 'en'}// target-state (MUTUALLY EXCLUSIVE){:else}// состояние цели (ВЗАИМОИСКЛЮЧАЮЩИЕ){/if}
  × (1 + DtOoC)                                    {#if lang === 'en'}// out of cover (separate, always active when not in cover){:else}// вне укрытия (отдельный){/if}
  × ExpertiseMultiplier                            {#if lang === 'en'}// Grade 0-30, +1%/grade, applies to BASE{:else}// Grade 0-30, +1%/ур., умножает БАЗУ{/if}</pre>
</section>

<section class="panel f-caps">
  <div class="panel-title"><span>{lang === 'en' ? 'Caps & Limits (from game files)' : 'Ограничения и капы (из игры)'}</span></div>
  <ul>
    <li><b>CHC hard cap: 60%</b> — {lang === 'en' ? 'any excess is wasted' : 'лишнее теряется'}</li>
    <li><b>CHD soft cap</b> — {lang === 'en' ? 'via diminishing returns vs WD stacking' : 'через diminishing returns vs WD'}</li>
    <li><b>Headshot dmg cap: 800% WD</b> ({lang === 'en' ? 'up to 1250% at HSD > 150%' : 'до 1250% при HSD > 150%'})</li>
    <li><b>Armor mitigation cap: 70%</b> ({lang === 'en' ? 'max damage reduction from armor' : 'макс снижение урона от брони'})</li>
    <li><b>Physical damage mitigation cap: 90%</b></li>
    <li><b>Method damage mitigation cap: 95%</b></li>
    <li><b>DoT mitigation cap: 90%</b> ({lang === 'en' ? 'Bleed/Burn damage reduction' : 'снижение Bleed/Burn урона'})</li>
    <li><b>Skill Power cap: 6</b> ({lang === 'en' ? '7 with Overcharge' : '7 с Overcharge'})</li>
    <li><b>Expertise cap: Grade 30</b></li>
    <li><b>Striker stacks: 100 default, 200 with chest talent</b></li>
    <li><b>SHD Watch bonus</b>: {lang === 'en' ? 'unlocks at 1000 SHD level' : 'с 1000 SHD-уровня'}</li>
  </ul>
</section>

<section class="panel f-caps">
  <div class="panel-title"><span>{lang === 'en' ? 'Status Effect Damage (from game)' : 'Урон от статусов (из игры)'}</span></div>
  <ul>
    <li><b>Bleed:</b> {lang === 'en' ? 'formula' : 'формула'} = (SkillCurveFinal × <b>35</b>) × (1 + BleedDamageModBonus)</li>
    <li><b>Burn:</b> {lang === 'en' ? 'formula' : 'формула'} = (SkillCurveFinal × <b>40</b>) × (1 + BurnDamageModBonus)</li>
    <li><b>Poison:</b> {lang === 'en' ? 'formula' : 'формула'} = (SkillCurveFinal × <b>20</b>) × (1 + PoisonDamageModBonus)</li>
    <li class="f-note">{lang === 'en' ? 'SkillCurveFinal depends on level/quality. Values from attribute_dictionary.mdict' : 'SkillCurveFinal зависит от уровня/качества. Значения из attribute_dictionary.mdict'}</li>
  </ul>
</section>

<section class="panel f-buckets">
  <div class="panel-title"><span>{lang === 'en' ? 'The 3 buckets' : '3 множителя бакетов'}</span></div>
  <div class="bucket">
    <div class="b-title additive">{lang === 'en' ? '1. Additive' : '1. Аддитивный'}</div>
    <div class="b-desc">
      {lang === 'en'
        ? 'All +%WD values stack by summing: (1 + 90% + 25% + 15%) = ×2.30'
        : 'Все +%WD складываются: (1 + 90% + 25% + 15%) = ×2.30'}
    </div>
  </div>
  <div class="bucket">
    <div class="b-title amplified">{lang === 'en' ? '2. Amplified (Multiplicative)' : '2. Усиленный (мультипликативный)'}</div>
    <div class="b-desc">
      {lang === 'en'
        ? 'Each amplified source multiplies separately: (1 + 25%) × (1 + 15%) = ×1.44'
        : 'Каждый amp-источник умножается отдельно: (1 + 25%) × (1 + 15%) = ×1.44'}
    </div>
  </div>
  <div class="bucket">
    <div class="b-title target">{lang === 'en' ? '3. Target-state' : '3. Состояние цели'}</div>
    <div class="b-desc">
      {lang === 'en'
        ? 'DtA (vs Armor) and DtH (vs Health) are MUTUALLY EXCLUSIVE — target has armor OR is on health, not both. OoC (Out of Cover) is a separate multiplier active when player not in cover.'
        : 'DtA (по броне) и DtH (по здоровью) ВЗАИМОИСКЛЮЧАЮЩИЕ — у цели либо броня, либо здоровье, не одновременно. OoC (вне укрытия) — отдельный множитель.'}
    </div>
  </div>
</section>

<section class="panel f-sources">
  <div class="panel-title"><span>{lang === 'en' ? 'Sources' : 'Источники'}</span></div>
  <ul>
    <li><a href="https://s-i-n.co.uk/div2/builds" target="_blank" rel="noopener">s-i-n.co.uk</a> — canonical formula</li>
    <li><a href="https://www.youtube.com/watch?v=tzV7oHmaiZo" target="_blank" rel="noopener">MarcoStyle — How & Why We Calculate DPS</a></li>
    <li><a href="https://drive.google.com/drive/folders/1TJzpvj5D-I7ANvMH76NZA6iLdSTTOb8_" target="_blank" rel="noopener">iKia87 Build DMG Calculators</a></li>
    <li>Division Discord Gearsheet (Ahmad#0001) — item data</li>
  </ul>
</section>

<style>
  .f-header, .f-main, .f-caps, .f-buckets, .f-sources { max-width: 900px; margin: 0 auto 14px; }
  .intro { color: var(--text-dim); font-size: 13px; line-height: 1.5; }
  .formula {
    font: 500 12px/1.6 var(--f-mono);
    color: var(--text-dim);
    background: var(--bg-2);
    border: 1px solid var(--border);
    border-radius: var(--r);
    padding: 14px;
    overflow-x: auto;
    white-space: pre;
  }
  ul { padding-left: 18px; line-height: 1.8; color: var(--text-dim); font-size: 13px; }
  ul li b { color: var(--text); }
  .f-note { font-size: 11px; color: var(--muted); font-style: italic; list-style: none; margin-top: 6px; }
  a { color: var(--blue); text-decoration: none; }
  a:hover { text-decoration: underline; }
  .bucket { padding: 10px 12px; background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--r); margin-bottom: 6px; }
  .b-title { font: 700 12px/1 var(--f-display); letter-spacing: .12em; text-transform: uppercase; margin-bottom: 6px; }
  .b-title.additive { color: var(--green); }
  .b-title.amplified { color: var(--orange); }
  .b-title.target { color: var(--red); }
  .b-desc { font-size: 12px; color: var(--text-dim); line-height: 1.5; }
</style>
