<script lang="ts">
  import { onMount } from 'svelte';
  import { loadGameData, type GameData } from './data.js';
  import { initI18n, detectLang, switchLang, i18next, type Locale } from './i18n.js';
  import { lang as langState, t } from './lang-state.svelte.js';
  import {
    createBuildState,
    computeBuild,
    SLOT_KEYS,
    type BuildSummary,
  } from './build-state.svelte.js';
  import WeaponPicker from './components/WeaponPicker.svelte';
  import GearSlot from './components/GearSlot.svelte';
  import BuildSummaryCard from './components/BuildSummary.svelte';
  import TabNav, { type Tab } from './components/TabNav.svelte';
  import CatalogView from './components/CatalogView.svelte';
  import WeaponTalentPanel from './components/WeaponTalentPanel.svelte';
  import LangDropdown from './components/LangDropdown.svelte';
  import HeaderActions from './components/HeaderActions.svelte';
  import GearTalentsPanel from './components/GearTalentsPanel.svelte';
  import { findSpec } from './data/specializations.js';
  import WeaponModsPanel from './components/WeaponModsPanel.svelte';
  import DpsBreakdown from './components/DpsBreakdown.svelte';
  import SkillsView from './components/SkillsView.svelte';
  import TankView from './components/TankView.svelte';
  import RecombinatorView from './components/RecombinatorView.svelte';
  import TopView from './components/TopView.svelte';
  import ConditionsPanel from './components/ConditionsPanel.svelte';
  import ExpertiseView from './components/ExpertiseView.svelte';
  import FormulasView from './components/FormulasView.svelte';
  import HelpView from './components/HelpView.svelte';
  import ItemPage from './components/ItemPage.svelte';
  import CommunityView from './components/CommunityView.svelte';
  import ModCatalog from './components/ModCatalog.svelte';
  import SetStacksPanel from './components/SetStacksPanel.svelte';
  import WarningsPanel from './components/WarningsPanel.svelte';
  import StatsInputPanel from './components/StatsInputPanel.svelte';
  import ModPresetsPanel from './components/ModPresetsPanel.svelte';
  import RecombinatorInputPanel from './components/RecombinatorInputPanel.svelte';
  import HistoryPanel from './components/HistoryPanel.svelte';
  import BuildCompare from './components/BuildCompare.svelte';
  import GearPresets from './components/GearPresets.svelte';
  import { CHEST_TALENT_BONUSES, BACKPACK_TALENT_BONUSES } from './data/gear-talent-bonuses.js';
  import { validateBuild } from './build-validation.js';

  const chestTalentOpts = CHEST_TALENT_BONUSES.map((t) => ({ id: t.id, name: t.name, note: t.note ?? '' }));
  const bpTalentOpts = BACKPACK_TALENT_BONUSES.map((t) => ({ id: t.id, name: t.name, note: t.note ?? '' }));
  import type { ModSlot } from './data/weapon-mods.js';
  import { encodeBuild, applyUrlToBuild } from './build-url.js';
  import { exportBuildAsPng, shareToTelegram } from './export-png.js';

  import { ui } from './ui-state.svelte.js';

  let data = $state<GameData | null>(null);
  let langReady = $state(false);
  let currentLang = $state<Locale>('en');
  let loadError = $state<string | null>(null);
  let activeTab = $state<Tab>('build');
  let itemPageId = $state<string | null>(null);

  const TAB_TITLES_EN: Record<Tab, string> = {
    build: 'Build', catalog: 'Catalog', dps: 'DPS', skills: 'Skills',
    tank: 'Tank', top: 'Top Builds', community: 'Community', mods: 'Mods',
    expertise: 'Expertise', recomb: 'Recombinator', formulas: 'Formulas', help: 'Help',
  };
  const TAB_TITLES_RU: Record<Tab, string> = {
    build: 'Билд', catalog: 'Каталог', dps: 'DPS', skills: 'Навыки',
    tank: 'Танк', top: 'Топ билдов', community: 'Сообщество', mods: 'Моды',
    expertise: 'Экспертиза', recomb: 'Рекомбинатор', formulas: 'Формулы', help: 'Справка',
  };

  $effect(() => {
    if (!langReady) return;
    const l = currentLang;
    const t = l === 'en' ? TAB_TITLES_EN[activeTab] : TAB_TITLES_RU[activeTab];
    document.title = `${t} · divcalc.xyz — Division 2 calc`;
    if (!itemPageId && location.hash !== `#${activeTab}`) {
      try {
        const newUrl = `${location.pathname}${location.search}#${activeTab}`;
        history.replaceState(null, '', newUrl);
      } catch { /* ignore */ }
    }
  });

  // Hash routing listener — for in-app /item links
  $effect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => {
      const rawHash = location.hash.replace(/^#/, '');
      const itemMatch = rawHash.match(/^item=(.+)$/);
      if (itemMatch) {
        itemPageId = decodeURIComponent(itemMatch[1]);
      } else {
        itemPageId = null;
        const validTabs: Tab[] = ['build', 'catalog', 'dps', 'skills', 'tank', 'top', 'community', 'mods', 'expertise', 'recomb', 'formulas', 'help'];
        if (validTabs.includes(rawHash as Tab)) activeTab = rawHash as Tab;
      }
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  });

  const build = createBuildState();

  let summary = $state<BuildSummary | null>(null);

  $effect(() => {
    if (!data) return;
    void build.weaponId;
    void build.weaponTalentActive;
    void build.weaponTalentStacks;
    void build.gear;
    void build.expertiseGrade;
    void build.headshotChancePct;
    void build.chestTalentId;
    void build.chestTalentActive;
    void build.backpackTalentId;
    void build.backpackTalentActive;
    void build.shdWatchActive;
    void build.weaponMods;
    void build.specializationId;
    void build.groupSize;
    void build.targetStatus;
    void build.targetPulsed;
    void build.fullArmor;
    void build.setStacks;
    summary = computeBuild(build, data);
  });

  onMount(async () => {
    try {
      const rawHash = location.hash.replace(/^#/, '');
      const itemMatch = rawHash.match(/^item=(.+)$/);
      if (itemMatch) {
        itemPageId = decodeURIComponent(itemMatch[1]);
      } else {
        const hashTab = rawHash as Tab;
        const validTabs: Tab[] = ['build', 'catalog', 'dps', 'skills', 'tank', 'top', 'community', 'mods', 'expertise', 'recomb', 'formulas', 'help'];
        if (validTabs.includes(hashTab)) {
          activeTab = hashTab;
        }
      }
      currentLang = detectLang();
      await initI18n(currentLang);
      langState.init(currentLang);
      ui.init();
      langReady = true;
      data = await loadGameData();
      const urlParams = new URLSearchParams(location.search);
      const BUILD_KEYS = new Set(['w', 'wt', 'wtal', 'ct', 'bt', 'shd', 'spec', 'exp', 'hs', 'fa', 'ts', 'tp', 'gs', 'ss', 'sct', 'sbt', 'chest', 'backpack', 'gloves', 'mask', 'holster', 'kneepads']);
      const hasBuildParams = Array.from(urlParams.keys()).some((k) => BUILD_KEYS.has(k) || k.startsWith('m_'));
      if (hasBuildParams) {
        applyUrlToBuild(build, urlParams);
        activeTab = 'build';
      }
      summary = computeBuild(build, data);
    } catch (err) {
      loadError = err instanceof Error ? err.message : String(err);
    }
  });

  let shareStatus = $state<'' | 'copied'>('');
  async function shareBuild() {
    const q = encodeBuild(build);
    const url = `${location.origin}${location.pathname}?${q}`;
    try {
      await navigator.clipboard.writeText(url);
      shareStatus = 'copied';
      setTimeout(() => (shareStatus = ''), 1500);
    } catch {
      history.replaceState({}, '', `?${q}`);
    }
  }
  async function exportPng() {
    const weapon = build.weaponId && data ? data.byId.weapon.get(build.weaponId) : null;
    const nm = weapon ? (i18next.t(weapon.id, { ns: 'weapons', defaultValue: weapon.id }) as string) : 'build';
    try {
      await exportBuildAsPng(nm);
    } catch (e) {
      alert((currentLang === 'ru' ? 'PNG экспорт не удался: ' : 'PNG export failed: ') + String(e));
    }
  }
  function shareTg() {
    const q = encodeBuild(build);
    const url = `${location.origin}${location.pathname}?${q}`;
    const weapon = build.weaponId && data ? data.byId.weapon.get(build.weaponId) : null;
    const nm = weapon ? (i18next.t(weapon.id, { ns: 'weapons', defaultValue: weapon.id }) as string) : '';
    shareToTelegram(url, nm);
  }

  async function onSwitchLang(l: Locale) {
    currentLang = l;
    await switchLang(l);
  }

  let headerSubtitle = $derived.by(() => {
    void langState.current;
    return i18next.t('header_subtitle', {
      ns: 'ui',
      defaultValue: 'Division 2 — DPS · Gear · Talents',
    }) as string;
  });
</script>

<header class="header">
  <LangDropdown current={currentLang} onPick={onSwitchLang} />
  <h1>DIVCALC</h1>
  <p>{headerSubtitle}</p>
  <div class="header-right">
    <HeaderActions {build} {data} {summary} />
  </div>
</header>

{#if langReady && data && summary && !itemPageId}
  <TabNav active={activeTab} onPick={(t) => (activeTab = t)} />
{/if}

<main class="shell">
  {#if loadError}
    <div class="status error">Load error: {loadError}</div>
  {:else if !langReady || !data || !summary}
    <div class="status">Loading…</div>
  {:else if itemPageId}
    <ItemPage {data} itemId={itemPageId} onClose={() => {
      itemPageId = null;
      history.replaceState(null, '', location.pathname + location.search + '#' + activeTab);
    }} />
  {:else if activeTab === 'build'}
    <div class="layout" class:pro-dash={ui.pro}>
      <div class="col col-left">
        <StatsInputPanel
          view="toggle"
          mode={build.inputMode}
          stats={build.manualStats}
          onModeChange={(m) => (build.inputMode = m)}
          onStatChange={(k, v) => build.setManualStat(k, v)}
        />
        <WeaponPicker
          {data}
          weaponId={build.weaponId}
          onPick={(id) => (build.weaponId = id)}
        />
        <WeaponTalentPanel
          {data}
          weaponId={build.weaponId}
          active={build.weaponTalentActive}
          stacks={build.weaponTalentStacks}
          customTalentId={build.customWeaponTalentId}
          onToggle={(v) => (build.weaponTalentActive = v)}
          onStacksChange={(n) => (build.weaponTalentStacks = n)}
          onCustomTalentChange={(id) => (build.customWeaponTalentId = id)}
        />

        {#if build.weaponId}
          {@const weapon = data.byId.weapon.get(build.weaponId)}
          {#if weapon}
            <WeaponModsPanel
              mods={build.weaponMods}
              onPick={(slot, id) => build.setWeaponMod(slot, id)}
              available={(weapon.modSlots as ModSlot[]) ?? []}
              weaponCategory={weapon.category}
            />
          {/if}
        {/if}
      </div>

      <div class="col col-center">
        {#if build.inputMode === 'stats'}
          <StatsInputPanel
            view="fields"
            mode={build.inputMode}
            stats={build.manualStats}
            onModeChange={(m) => (build.inputMode = m)}
            onStatChange={(k, v) => build.setManualStat(k, v)}
          />
        {/if}
        <section class="panel">
          <div class="panel-title">
            <span>{t('ui', 'gear')}</span>
          </div>
          <div class="slots">
            {#each SLOT_KEYS as slot (slot)}
              <GearSlot
                {slot}
                slotState={build.gear[slot]}
                {data}
                onBrandChange={(id) => build.setSlotBrand(slot, id)}
                onSetChange={(id) => build.setSlotSet(slot, id)}
                onNamedChange={(id) => build.setSlotNamed(slot, id)}
                onCoreChange={(stat) => build.setSlotCore(slot, stat)}
                onAttrChange={(which, stat) => build.setSlotAttr(slot, which, stat)}
                onModChange={(id) => build.setSlotAttr(slot, 'modAttr', id as never)}
                talentId={slot === 'chest' ? build.chestTalentId : slot === 'backpack' ? build.backpackTalentId : null}
                talentActive={slot === 'chest' ? build.chestTalentActive : slot === 'backpack' ? build.backpackTalentActive : false}
                talentOptions={slot === 'chest' ? chestTalentOpts : slot === 'backpack' ? bpTalentOpts : undefined}
                onTalentChange={slot === 'chest' ? (id) => (build.chestTalentId = id) : slot === 'backpack' ? (id) => (build.backpackTalentId = id) : undefined}
                onTalentActiveChange={slot === 'chest' ? (v) => (build.chestTalentActive = v) : slot === 'backpack' ? (v) => (build.backpackTalentActive = v) : undefined}
                inputMode={build.inputMode}
                exoticTalentActive={!!build.exoticActive[slot]}
                onExoticTalentToggle={(v) => build.setExoticActive(slot, v)}
              />
            {/each}
          </div>

          <div class="controls-row">
            <label>
              <span>Expertise</span>
              <input class="input num" type="number" min="0" max="30" bind:value={build.expertiseGrade} />
            </label>
            <label>
              <span>HS %</span>
              <input class="input num" type="number" min="0" max="100" bind:value={build.headshotChancePct} />
            </label>
            <button class="btn share" onclick={shareBuild}>{shareStatus === 'copied' ? '✓' : '🔗'} Share</button>
            <button class="btn share" onclick={shareTg} title="Telegram">✈</button>
            <button class="btn share" onclick={exportPng} title="Export PNG">📷</button>
            <button class="btn danger" onclick={() => build.reset()}>Reset</button>
          </div>
        </section>

        <GearTalentsPanel
          shdActive={build.shdWatchActive}
          specId={build.specializationId}
          classPicks={build.specClassPicks}
          mmrRifleHsd={build.specMmrRifleHsd}
          onShdActiveChange={(v) => (build.shdWatchActive = v)}
          onSpecChange={(id) => (build.specializationId = id)}
          onClassPickToggle={(cls) => build.toggleSpecClassPick(cls)}
          onMmrRifleHsdChange={(v) => (build.specMmrRifleHsd = v)}
        />

        {#if build.specializationId}
          {@const spec = findSpec(build.specializationId)}
          {#if spec?.treePerks?.length}
            <section class="panel">
              <div class="panel-title"><span>🌳 Дерево спека — пассивки</span></div>
              {#each spec.treePerks as perk (perk.id)}
                <label class="perk-row">
                  <input
                    type="checkbox"
                    checked={build.activeSpecPerks.includes(perk.id)}
                    onchange={() => build.toggleSpecPerk(perk.id)}
                  />
                  <span class="perk-name">{perk.name.ru}</span>
                  {#if perk.condition}
                    <span class="perk-cond">{perk.condition.ru}</span>
                  {/if}
                </label>
              {/each}
            </section>
          {/if}
        {/if}

        <ConditionsPanel
          groupSize={build.groupSize}
          targetStatus={build.targetStatus}
          targetPulsed={build.targetPulsed}
          fullArmor={build.fullArmor}
          onGroupSize={(n) => (build.groupSize = n)}
          onStatus={(s) => (build.targetStatus = s)}
          onPulsed={(v) => (build.targetPulsed = v)}
          onFullArmor={(v) => (build.fullArmor = v)}
        />

        {#if summary}
          {@const autoChest = Object.fromEntries(
            Object.entries(summary.setCounts).map(([id]) => [id, build.gear.chest.setId === id])
          )}
          {@const autoBp = Object.fromEntries(
            Object.entries(summary.setCounts).map(([id]) => [id, build.gear.backpack.setId === id])
          )}
          <SetStacksPanel
            setCounts={summary.setCounts}
            stacks={build.setStacks}
            chestTalent={autoChest}
            bpTalent={autoBp}
            onChange={(id, n) => build.setSetStacks(id, n)}
            onChestTalent={() => {}}
            onBpTalent={() => {}}
          />
        {/if}

        <GearPresets {build} />

        <ModPresetsPanel {build} {data} />

        <RecombinatorInputPanel {build} />
      </div>

      <div class="col col-right">
        <BuildSummaryCard {summary} {data} weaponId={build.weaponId} dashboardMode={true} />
        <WarningsPanel warnings={validateBuild(build, summary, data)} />
      </div>
    </div>
  {:else if activeTab === 'catalog'}
    <CatalogView {data} />
  {:else if activeTab === 'dps'}
    <DpsBreakdown
      {summary}
      {data}
      weaponId={build.weaponId}
      expertiseGrade={build.expertiseGrade}
      headshotChancePct={build.headshotChancePct}
      fullArmor={build.fullArmor}
    />
  {:else if activeTab === 'skills'}
    <SkillsView />
  {:else if activeTab === 'tank'}
    <TankView />
  {:else if activeTab === 'top'}
    <TopView {build} {data} onLoaded={() => (activeTab = 'build')} />
  {:else if activeTab === 'community'}
    <CommunityView />
  {:else if activeTab === 'mods'}
    <ModCatalog />
  {:else if activeTab === 'recomb'}
    <RecombinatorView />
  {:else if activeTab === 'expertise'}
    <ExpertiseView />
  {:else if activeTab === 'formulas'}
    <FormulasView />
  {:else if activeTab === 'help'}
    <HelpView />
  {:else}
    <section class="panel placeholder">
      <div class="panel-title"><span>{t('ui', `tab_${activeTab}`)}</span></div>
      <div class="placeholder-body">{t('ui', 'coming_soon')}</div>
    </section>
  {/if}
</main>

{#if ui.isMobile && summary && build.weaponId}
  {@const numLocale = currentLang === 'ru' ? 'ru' : 'en'}
  <div class="dps-sticky">
    <div class="primary">
      <span class="v">{Math.round(summary.dps.burstDps / 1000)}k</span>
      <span class="l">BURST</span>
    </div>
    <span class="sep">·</span>
    <div class="secondary">
      <span class="v">{Math.round(summary.dps.sustainedDps / 1000)}k</span>
      <span class="l">SUS</span>
    </div>
  </div>
{/if}

<footer class="footer">
  <span class="foot-brand">divcalc</span>
  <span class="foot-muted">Y8S1 "Rise Up" (TU22.1, Apr 2026) · {data?.weapons.length ?? 0} weapons · {data?.brands.length ?? 0} brands · {data?.sets.length ?? 0} sets</span>
</footer>

<style>
  .shell { max-width: 1400px; margin: 0 auto; padding: 18px; }
  .status { padding: 60px; text-align: center; color: var(--muted); font: 700 14px/1 var(--f-display); letter-spacing: .18em; text-transform: uppercase; }
  .status.error { color: var(--red); }
  .layout { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
  /* PRO mode: expand right column into dashboard (2fr), gear stays interactive but narrower */
  .layout.pro-dash { grid-template-columns: 1fr 0.8fr 2fr; }
  @media (min-width: 1600px) {
    .layout.pro-dash { grid-template-columns: 0.8fr 0.9fr 2.3fr; }
  }
  @media (max-width: 1100px) {
    .layout, .layout.pro-dash { grid-template-columns: 1fr; }
  }
  .slots { display: grid; grid-template-columns: 1fr; gap: 6px; margin-bottom: 14px; }
  .controls-row { display: flex; gap: 8px; align-items: flex-end; padding-top: 8px; border-top: 1px solid var(--border); }
  .controls-row label { display: flex; flex-direction: column; gap: 3px; flex: 1; }
  .controls-row label span { font: 700 9px/1 var(--f-display); color: var(--muted); text-transform: uppercase; letter-spacing: .12em; }
  .controls-row .input { padding: 6px 8px; font-size: 12px; width: 100%; }
  .btn.share { color: var(--blue); border-color: rgba(88,169,255,.35); background: rgba(88,169,255,.08); }
  .btn.share:hover { background: rgba(88,169,255,.2); border-color: var(--blue); }
  .placeholder { max-width: 800px; margin: 0 auto; }
  .placeholder-body { padding: 60px 20px; text-align: center; color: var(--muted); font: 700 14px/1 var(--f-display); letter-spacing: .22em; text-transform: uppercase; }
  .footer { padding: 20px; text-align: center; border-top: 1px solid var(--border); margin-top: 30px; }
  .foot-brand { font: 700 11px/1 var(--f-display); color: var(--orange); letter-spacing: .22em; text-transform: uppercase; margin-right: 12px; }
  .foot-muted { font: 500 10px/1 var(--f-mono); color: var(--dim); letter-spacing: .06em; }
  .perk-row { display: flex; align-items: center; gap: 8px; padding: 4px 2px; font-size: 11px; cursor: pointer; }
  .perk-row input { accent-color: var(--orange); }
  .perk-name { color: var(--text); font-weight: 600; }
  .perk-cond { color: var(--muted); font-size: 10px; font-style: italic; }
</style>
