<script lang="ts">
  import { lang as langState } from '../lang-state.svelte.js';
  let lang = $derived(langState.current);
</script>

<section class="panel f-header">
  <div class="panel-title">
    <span>{lang === 'ru' ? 'Справочник формул DPS' : 'DPS Formula Reference'}</span>
  </div>
  <div class="intro">
    {lang === 'ru' ? 'Основано на каноничной формуле сообщества s-i-n.co.uk (Division 2, Y8S1, 2026).' : 'Based on s-i-n.co.uk community canonical formula (Division 2, Y8S1, 2026).'}
  </div>
</section>

<section class="panel f-main">
  <div class="panel-title"><span>{lang === 'ru' ? 'Главная формула' : 'Master formula'}</span></div>
  <pre class="formula">{lang === 'ru' ? 'Итоговый урон' : 'Final Damage'} = {lang === 'ru' ? 'Базовый урон оружия' : 'Base Weapon Damage'}
  × (1 + WeaponDmg% + WeaponTypeDmg%)              {lang === 'ru' ? '// аддитивное ядро' : '// additive core'}
  × (1 + Σ additive talents)                       {lang === 'ru' ? '// Vigilance + Composure + Obliterate + Focus...' : '// Vigilance + Composure + Obliterate + Focus...'}
  × (1 + Amp1) × (1 + Amp2) × (1 + Amp3)           {lang === 'ru' ? '// Glass Cannon, Spotter, Wicked — перемножаются' : '// Glass Cannon, Spotter, Wicked — multiply separately'}
  × (1 + CHC × CHD + HS_chance × HSD)              {lang === 'ru' ? '// крит + хедшот' : '// crit + headshot bracket'}
  × (1 + DtArmor {lang === 'ru' ? 'или' : 'or'} DtHealth)                      {lang === 'ru' ? '// состояние цели (ВЗАИМОИСКЛЮЧАЮЩИЕ)' : '// target-state (MUTUALLY EXCLUSIVE)'}
  × (1 + DtOoC)                                    {lang === 'ru' ? '// вне укрытия (отдельный)' : '// out of cover (separate, always active when not in cover)'}
  × ExpertiseMultiplier                            {lang === 'ru' ? '// Grade 0-30, +1%/ур., умножает БАЗУ' : '// Grade 0-30, +1%/grade, applies to BASE'}</pre>
</section>

<section class="panel f-caps">
  <div class="panel-title"><span>{lang === 'ru' ? 'Ограничения и капы (из игры)' : 'Caps & Limits (from game files)'}</span></div>
  <ul>
    <li><b>{lang === 'ru' ? 'CHC жёсткий cap: 60%' : 'CHC hard cap: 60%'}</b> — {lang === 'ru' ? 'лишнее теряется' : 'any excess is wasted'}</li>
    <li><b>{lang === 'ru' ? 'CHD мягкий cap' : 'CHD soft cap'}</b> — {lang === 'ru' ? 'через убывающую отдачу при стаке WD' : 'via diminishing returns vs WD stacking'}</li>
    <li><b>{lang === 'ru' ? 'Хедшот урон (cap): 800% WD' : 'Headshot dmg cap: 800% WD'}</b> ({lang === 'ru' ? 'до 1250% при HSD > 150%' : 'up to 1250% at HSD > 150%'})</li>
    <li><b>{lang === 'ru' ? 'Снижение брони (cap): 70%' : 'Armor mitigation cap: 70%'}</b> ({lang === 'ru' ? 'макс снижение урона от брони' : 'max damage reduction from armor'})</li>
    <li><b>{lang === 'ru' ? 'Физический урон (cap): 90%' : 'Physical damage mitigation cap: 90%'}</b></li>
    <li><b>{lang === 'ru' ? 'Урон методом (cap): 95%' : 'Method damage mitigation cap: 95%'}</b></li>
    <li><b>{lang === 'ru' ? 'DoT урон (cap): 90%' : 'DoT mitigation cap: 90%'}</b> ({lang === 'ru' ? 'снижение Bleed/Burn урона' : 'Bleed/Burn damage reduction'})</li>
    <li><b>{lang === 'ru' ? 'Сила навыков (cap): 6' : 'Skill Power cap: 6'}</b> ({lang === 'ru' ? '7 с Overcharge' : '7 with Overcharge'})</li>
    <li><b>{lang === 'ru' ? 'Экспертиза (cap): Grade 30' : 'Expertise cap: Grade 30'}</b></li>
    <li><b>{lang === 'ru' ? 'Стаки Страйкера: 100 базово, 200 с chest-талантом' : 'Striker stacks: 100 default, 200 with chest talent'}</b></li>
    <li><b>{lang === 'ru' ? 'Бонус SHD Watch' : 'SHD Watch bonus'}</b>: {lang === 'ru' ? 'с 1000 SHD-уровня' : 'unlocks at 1000 SHD level'}</li>
  </ul>
</section>

<section class="panel f-caps">
  <div class="panel-title"><span>{lang === 'ru' ? 'Урон от статусов (из игры)' : 'Status Effect Damage (from game)'}</span></div>
  <ul>
    <li><b>Bleed:</b> {lang === 'ru' ? 'формула' : 'formula'} = (SkillCurveFinal × <b>35</b>) × (1 + BleedDamageModBonus)</li>
    <li><b>Burn:</b> {lang === 'ru' ? 'формула' : 'formula'} = (SkillCurveFinal × <b>40</b>) × (1 + BurnDamageModBonus)</li>
    <li><b>Poison:</b> {lang === 'ru' ? 'формула' : 'formula'} = (SkillCurveFinal × <b>20</b>) × (1 + PoisonDamageModBonus)</li>
    <li class="f-note">{lang === 'ru' ? 'SkillCurveFinal зависит от уровня/качества. Значения из attribute_dictionary.mdict' : 'SkillCurveFinal depends on level/quality. Values from attribute_dictionary.mdict'}</li>
  </ul>
</section>

<section class="panel f-buckets">
  <div class="panel-title"><span>{lang === 'ru' ? '3 множителя бакетов' : 'The 3 buckets'}</span></div>
  <div class="bucket">
    <div class="b-title additive">{lang === 'ru' ? '1. Аддитивный' : '1. Additive'}</div>
    <div class="b-desc">
      {lang === 'ru' ? 'Все +%WD складываются: (1 + 90% + 25% + 15%) = ×2.30' : 'All +%WD values stack by summing: (1 + 90% + 25% + 15%) = ×2.30'}
    </div>
  </div>
  <div class="bucket">
    <div class="b-title amplified">{lang === 'ru' ? '2. Усиленный (мультипликативный)' : '2. Amplified (Multiplicative)'}</div>
    <div class="b-desc">
      {lang === 'ru' ? 'Каждый amp-источник умножается отдельно: (1 + 25%) × (1 + 15%) = ×1.44' : 'Each amplified source multiplies separately: (1 + 25%) × (1 + 15%) = ×1.44'}
    </div>
  </div>
  <div class="bucket">
    <div class="b-title target">{lang === 'ru' ? '3. Состояние цели' : '3. Target-state'}</div>
    <div class="b-desc">
      {lang === 'ru' ? 'DtA (по броне) и DtH (по здоровью) ВЗАИМОИСКЛЮЧАЮЩИЕ — у цели либо броня, либо здоровье, не одновременно. OoC (вне укрытия) — отдельный множитель.' : 'DtA (vs Armor) and DtH (vs Health) are MUTUALLY EXCLUSIVE — target has armor OR is on health, not both. OoC (Out of Cover) is a separate multiplier active when player not in cover.'}
    </div>
  </div>
</section>

<section class="panel f-sources">
  <div class="panel-title"><span>{lang === 'ru' ? 'Источники' : 'Sources'}</span></div>
  <ul>
    <li><a href="https://s-i-n.co.uk/div2/builds" target="_blank" rel="noopener">s-i-n.co.uk</a> — {lang === 'ru' ? 'каноничная формула' : 'canonical formula'}</li>
    <li><a href="https://www.youtube.com/watch?v=tzV7oHmaiZo" target="_blank" rel="noopener">MarcoStyle — {lang === 'ru' ? 'Как и почему мы считаем DPS' : 'How & Why We Calculate DPS'}</a></li>
    <li><a href="https://drive.google.com/drive/folders/1TJzpvj5D-I7ANvMH76NZA6iLdSTTOb8_" target="_blank" rel="noopener">iKia87 {lang === 'ru' ? 'Калькуляторы билдов' : 'Build DMG Calculators'}</a></li>
    <li>Division Discord Gearsheet (Ahmad#0001) — {lang === 'ru' ? 'данные предметов' : 'item data'}</li>
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
