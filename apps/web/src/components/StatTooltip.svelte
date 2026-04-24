<script lang="ts">
  import { lang as langState } from '../lang-state.svelte.js';

  interface Props {
    stat: string;
    children?: () => unknown;
  }

  let { stat, children }: Props = $props();
  let lang = $derived(langState.current);

  const TIPS: Record<string, { en: string; ru: string }> = {
    wd: {
      en: 'Weapon Damage — additive bucket. Multiple WD sources sum up: (1 + 90% + 25%) = ×2.15',
      ru: 'Урон оружия — аддитивный бакет. Суммируется: (1 + 90% + 25%) = ×2.15',
    },
    chc: {
      en: 'Crit Chance. Hard cap 60% — excess wasted. Formula: (1 + CHC × CHD)',
      ru: 'Шанс крита. Hard cap 60% — избыток теряется. Формула: (1 + CHC × CHD)',
    },
    chd: {
      en: 'Crit Damage. No cap. Multiplies via CHC × CHD bracket.',
      ru: 'Урон крита. Капа нет. Умножается через CHC × CHD.',
    },
    hsd: {
      en: 'Headshot Damage. Cap: 800% WD (1250% if HSD > 150%). Applied via HS_chance × HSD.',
      ru: 'Урон в голову. Кап: 800% WD (1250% при HSD > 150%). Применяется через HS × HSD.',
    },
    dta: {
      en: 'Damage to Armor — target state. Active when target has armor. Mutex with DtH.',
      ru: 'Урон по броне — состояние цели. Активен когда у цели есть броня. Взаимоисключ. с DtH.',
    },
    dth: {
      en: 'Damage to Health — target state. Active when armor depleted. Mutex with DtA.',
      ru: 'Урон по здоровью — состояние цели. Активен после пробития брони. Взаимоисключ. с DtA.',
    },
    ooc: {
      en: 'Out of Cover — separate multiplier. Active when player not in cover.',
      ru: 'Вне укрытия — отдельный множитель. Активен когда игрок не в укрытии.',
    },
    rof: {
      en: 'Rate of Fire — multiplies weapon RPM. More shots/sec = more burst DPS.',
      ru: 'Скорострельность — умножает RPM. Больше выстрелов/сек = больше burst DPS.',
    },
    mag: {
      en: 'Magazine Size. More rounds = fewer reloads = higher sustained DPS.',
      ru: 'Размер магазина. Больше патронов = меньше перезарядок = выше sustained DPS.',
    },
    reload: {
      en: 'Reload Speed. Reduces reload time. Improves sustained DPS.',
      ru: 'Скорость перезарядки. Сокращает время. Улучшает sustained DPS.',
    },
    handling: {
      en: 'Handling — stability + accuracy + swap speed. Not in formula, but QoL.',
      ru: 'Управление — стабильность + точность + скорость свапа. Не в формуле, но комфорт.',
    },
  };

  let tip = $derived(TIPS[stat.toLowerCase()] ?? null);
</script>

{#if tip}
  <span class="stat-tip" title={lang === 'en' ? tip.en : tip.ru}>
    ⓘ
  </span>
{/if}

<style>
  .stat-tip {
    display: inline-block;
    margin-left: 4px;
    font-size: 10px;
    color: var(--muted);
    cursor: help;
    opacity: 0.6;
  }
  .stat-tip:hover { color: var(--blue); opacity: 1; }
</style>
