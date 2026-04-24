<script lang="ts">
  import { lang as langState } from '../lang-state.svelte.js';
  let lang = $derived(langState.current);

  interface FAQ { q_en: string; a_en: string; q_ru: string; a_ru: string; }
  const FAQS: FAQ[] = [
    {
      q_en: 'Why is Burst DPS different from Sustained DPS?',
      a_en: 'Burst DPS = damage per second while firing. Sustained DPS = average including reload time (magazine_damage / cycle_time).',
      q_ru: 'Чем отличается Пиковый DPS от Среднего?',
      a_ru: 'Пиковый DPS = урон за секунду пока стреляешь. Средний = с учётом перезарядки (урон_магазина / время_цикла).',
    },
    {
      q_en: 'Does CHC have a cap?',
      a_en: 'Yes. Hard cap is 60%. Anything above is wasted. Plan your build for exactly 60% CHC.',
      q_ru: 'Есть ли cap на CHC?',
      a_ru: 'Да. Hard cap 60%. Всё выше — потеря. Целься ровно в 60% CHC.',
    },
    {
      q_en: 'What\'s the difference between additive and amplified talents?',
      a_en: 'Additive talents add their % to the main WD bucket: +25% joins +90% to give +115%. Amplified talents multiply separately: ×1.25 after the whole additive bucket — stronger at high WD.',
      q_ru: 'В чём разница additive и amplified талантов?',
      a_ru: 'Additive — % идёт в общий WD-бакет: +25% + +90% = +115%. Amplified — отдельный множитель ×1.25 после бакета, сильнее на высоком WD.',
    },
    {
      q_en: 'What is Expertise?',
      a_en: 'Per-item leveling system (Grade 0-30). Each grade adds +1% weapon damage, +0.3% armor, +0.5% skill damage multiplicatively.',
      q_ru: 'Что такое Expertise?',
      a_ru: 'Система апгрейда предметов (Grade 0-30). Каждый уровень добавляет +1% урона оружия, +0.3% брони, +0.5% урона навыков мультипликативно.',
    },
    {
      q_en: 'How is SHD Watch bonus applied?',
      a_en: 'At 1000+ SHD level, you get +10% WD (additive), +10% CHC, +10% CHD. The CHC still respects the 60% cap.',
      q_ru: 'Как применяется SHD Watch бонус?',
      a_ru: 'С 1000+ SHD-уровня: +10% WD (additive), +10% CHC, +10% CHD. CHC всё ещё уважает cap 60%.',
    },
    {
      q_en: 'Why some weapons have no talent shown?',
      a_en: 'For exotics/named weapons, talent data is partially migrated from v1. Some exotics still missing their talent mapping — will be fixed in future updates.',
      q_ru: 'Почему у некоторых экзотиков нет таланта?',
      a_ru: 'Данные талантов для экзотиков перенесены частично. Некоторые экзотики пока без таланта — это будет исправлено в будущих обновлениях.',
    },
    {
      q_en: 'How does sharing a build work?',
      a_en: 'Click "Share" on Build tab — copies a URL with all your settings encoded. Open the URL to load the same build.',
      q_ru: 'Как работает Share билда?',
      a_ru: 'Кнопка "Share" на вкладке Билд — копирует URL со всеми настройками. Открыть URL → билд загрузится.',
    },
    {
      q_en: 'What\'s the difference between v1 and v2?',
      a_en: 'v1 (old divcalc.xyz) is 2.4 MB of JS in one file. v2 is 40 KB gzip, monorepo with tested formulas, proper i18n (EN + RU), Svelte 5 + Vite.',
      q_ru: 'В чём разница v1 и v2?',
      a_ru: 'v1 (старый divcalc.xyz) — 2.4 MB в одном файле. v2 — 40 KB gzip, монорепо с тестируемыми формулами, правильный i18n (EN + RU), Svelte 5 + Vite.',
    },
  ];

  function q(f: FAQ) { void lang; return lang === 'en' ? f.q_en : f.q_ru; }
  function a(f: FAQ) { void lang; return lang === 'en' ? f.a_en : f.a_ru; }
</script>

<section class="panel help-header">
  <div class="panel-title"><span>{lang === 'en' ? 'Help / FAQ' : 'Справка / FAQ'}</span></div>
  <div class="intro">
    {lang === 'en'
      ? 'Common questions about the calculator and Division 2 mechanics.'
      : 'Частые вопросы про калькулятор и механики Division 2.'}
  </div>
</section>

<div class="faq-list">
  {#each FAQS as f, i (i)}
    <details class="faq-item">
      <summary>{q(f)}</summary>
      <div class="answer">{a(f)}</div>
    </details>
  {/each}
</div>

<section class="panel help-contact">
  <div class="panel-title"><span>{lang === 'en' ? 'Contact & Credits' : 'Контакты и авторы'}</span></div>
  <ul>
    <li>
      {lang === 'en' ? 'Project' : 'Проект'}:
      <a href="https://github.com/Mokhnatti/division2-calc" target="_blank" rel="noopener">github.com/Mokhnatti/division2-calc</a>
    </li>
    <li>
      {lang === 'en' ? 'Formulas' : 'Формулы'}:
      <a href="https://s-i-n.co.uk/div2/builds" target="_blank" rel="noopener">s-i-n.co.uk</a> · MarcoStyle · iKia87 · Ahmad gearsheet
    </li>
    <li>
      {lang === 'en' ? 'Data' : 'Данные'}:
      {lang === 'en' ? 'partially from Division community, not official.' : 'частично из сообщества Division, неофициальные.'}
    </li>
    <li>
      {lang === 'en'
        ? 'This is a fan project. Not affiliated with Ubisoft / Massive Entertainment.'
        : 'Фанатский проект. Не связан с Ubisoft / Massive Entertainment.'}
    </li>
  </ul>
</section>

<style>
  .help-header, .help-contact { max-width: 800px; margin: 0 auto 14px; }
  .intro { color: var(--text-dim); font-size: 13px; line-height: 1.5; }
  .faq-list { max-width: 800px; margin: 0 auto 14px; display: flex; flex-direction: column; gap: 6px; }
  .faq-item {
    background: var(--card); border: 1px solid var(--border);
    border-radius: var(--r); overflow: hidden;
  }
  .faq-item summary {
    padding: 12px 16px;
    cursor: pointer;
    font: 700 12px/1.4 var(--f-display); letter-spacing: .06em;
    color: var(--orange);
    list-style: none;
  }
  .faq-item summary::-webkit-details-marker { display: none; }
  .faq-item summary::before { content: '+ '; color: var(--muted); }
  .faq-item[open] summary::before { content: '− '; }
  .faq-item[open] summary { color: var(--orange-hi); border-bottom: 1px solid var(--border); }
  .answer { padding: 12px 16px; color: var(--text-dim); font-size: 13px; line-height: 1.6; }
  ul { padding-left: 18px; line-height: 1.8; color: var(--text-dim); font-size: 13px; }
  a { color: var(--blue); text-decoration: none; }
  a:hover { text-decoration: underline; }
</style>
