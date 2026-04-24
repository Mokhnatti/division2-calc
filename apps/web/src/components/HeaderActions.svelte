<script lang="ts">
  import { lang as langState } from '../lang-state.svelte.js';
  import type { BuildState, BuildSummary } from '../build-state.svelte.js';
  import type { GameData } from '../data.js';
  import { loadHistory, saveBuildToHistory, loadBuildFromHistory, deleteBuildFromHistory, type SavedBuild } from '../build-history.js';

  interface Props {
    build?: BuildState;
    data?: GameData;
    summary?: BuildSummary;
  }

  let { build, data, summary }: Props = $props();

  let lang = $derived(langState.current);
  let buildsOpen = $state(false);
  let saveName = $state('');
  let savedList = $state<SavedBuild[]>([]);

  $effect(() => {
    try { savedList = loadHistory(); } catch { savedList = []; }
  });

  function refreshList() {
    try { savedList = loadHistory(); } catch { savedList = []; }
  }

  function doSave() {
    if (!build) return;
    const name = saveName.trim() || `Build ${new Date().toLocaleTimeString()}`;
    savedList = saveBuildToHistory(build, name);
    saveName = '';
  }

  function doLoad(s: SavedBuild) {
    if (!build) return;
    loadBuildFromHistory(build, s);
    buildsOpen = false;
  }

  function doDelete(name: string) {
    savedList = deleteBuildFromHistory(name);
  }

  let username = $state('');
  let email = $state('');
  let pw = $state('');
  let pwConfirm = $state('');
  let loggedIn = $state(false);
  let authOpen = $state(false);
  let authMode = $state<'login' | 'register'>('login');
  let bugOpen = $state(false);
  let bugTitle = $state('');
  let bugBody = $state('');
  let loginMsg = $state('');
  let busy = $state(false);

  $effect(() => {
    try {
      const raw = localStorage.getItem('divcalc:auth');
      if (raw) {
        const a = JSON.parse(raw);
        if (a?.token && a?.username) { username = a.username; loggedIn = true; }
      }
    } catch { /* ignore */ }
  });

  function openAuth(mode: 'login' | 'register') {
    authMode = mode;
    authOpen = true;
    bugOpen = false;
    loginMsg = '';
  }

  async function doLogin() {
    if (!username || !pw) {
      loginMsg = lang === 'ru' ? 'Введи логин/email и пароль' : 'Enter username/email and password';
      return;
    }
    busy = true;
    loginMsg = '';
    try {
      const r = await fetch('/api/collections/users/auth-with-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity: username, password: pw }),
      });
      const j = await r.json();
      if (!r.ok) {
        loginMsg = (lang === 'ru' ? 'Не удалось войти: ' : 'Login failed: ') + (j?.message || r.status);
        return;
      }
      localStorage.setItem('divcalc:auth', JSON.stringify({ token: j.token, username: j.record?.username, id: j.record?.id }));
      username = j.record?.username || username;
      loggedIn = true;
      loginMsg = '';
      pw = '';
      setTimeout(() => { authOpen = false; }, 500);
    } catch (e) {
      loginMsg = (lang === 'ru' ? 'Ошибка сети: ' : 'Network error: ') + String(e);
    } finally {
      busy = false;
    }
  }

  async function doRegister() {
    if (!username || !email || !pw || !pwConfirm) {
      loginMsg = lang === 'ru' ? 'Заполни все поля' : 'Fill all fields';
      return;
    }
    if (pw !== pwConfirm) {
      loginMsg = lang === 'ru' ? 'Пароли не совпадают' : 'Passwords do not match';
      return;
    }
    if (pw.length < 8) {
      loginMsg = lang === 'ru' ? 'Пароль — минимум 8 символов' : 'Password min 8 chars';
      return;
    }
    busy = true;
    loginMsg = '';
    try {
      const r = await fetch('/api/collections/users/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password: pw, passwordConfirm: pwConfirm }),
      });
      const j = await r.json();
      if (!r.ok) {
        const fieldErr = j?.data ? Object.entries(j.data).map(([k, v]) => `${k}: ${(v as { message?: string })?.message || ''}`).join('; ') : '';
        loginMsg = (lang === 'ru' ? 'Регистрация не удалась: ' : 'Register failed: ') + (fieldErr || j?.message || r.status);
        return;
      }
      await doLogin();
    } catch (e) {
      loginMsg = (lang === 'ru' ? 'Ошибка сети: ' : 'Network error: ') + String(e);
    } finally {
      busy = false;
    }
  }

  function logout() {
    try { localStorage.removeItem('divcalc:auth'); } catch { /* ignore */ }
    loggedIn = false;
    username = '';
    email = '';
    pw = '';
    pwConfirm = '';
    loginMsg = '';
    authOpen = false;
  }

  function submitBug() {
    const title = encodeURIComponent(bugTitle || 'Bug report from user');
    const body = encodeURIComponent(
      (bugBody || '') +
      `\n\n---\nUrl: ${location.href}\nUA: ${navigator.userAgent}\nLang: ${lang}\nUser: ${username || 'anon'}\n`
    );
    const url = `https://github.com/Mokhnatti/division2-calc/issues/new?title=${title}&body=${body}&labels=user-report`;
    window.open(url, '_blank', 'noopener');
    bugOpen = false;
    bugTitle = '';
    bugBody = '';
  }

  function closeOverlays() {
    authOpen = false;
    bugOpen = false;
    buildsOpen = false;
  }
  // Silence unused warnings when props not provided
  void data; void summary; void refreshList;
</script>

<div class="ha-row">
  {#if loggedIn}
    <button
      class="ha-btn on"
      onclick={() => openAuth('login')}
      title={lang === 'ru' ? 'Профиль' : 'Profile'}
    >
      👤 {username}
    </button>
  {:else}
    <button class="ha-btn" onclick={() => openAuth('login')}>
      👤 {lang === 'ru' ? 'Войти' : 'Sign in'}
    </button>
    <button class="ha-btn reg" onclick={() => openAuth('register')}>
      ✨ {lang === 'ru' ? 'Регистрация' : 'Register'}
    </button>
  {/if}
  {#if build}
    <button
      class="ha-btn builds"
      onclick={() => { buildsOpen = !buildsOpen; authOpen = false; bugOpen = false; }}
      title={lang === 'ru' ? 'Сохранённые билды' : 'Saved builds'}
    >
      💾 {lang === 'ru' ? 'Билды' : 'Builds'}{#if savedList.length > 0}<span class="count">{savedList.length}</span>{/if}
    </button>
  {/if}
  <button
    class="ha-btn bug"
    onclick={() => { bugOpen = !bugOpen; authOpen = false; buildsOpen = false; }}
    title={lang === 'ru' ? 'Сообщить о баге' : 'Bug report'}
  >
    🐛
  </button>
</div>

{#if buildsOpen && build}
  <div class="ha-overlay" onclick={closeOverlays} role="presentation"></div>
  <div class="ha-pop wide">
    <div class="ha-pop-title">💾 {lang === 'ru' ? 'Сохранённые билды' : 'Saved builds'}</div>
    <div class="save-row">
      <input
        class="input"
        type="text"
        placeholder={lang === 'ru' ? 'Имя билда' : 'Build name'}
        bind:value={saveName}
        onkeydown={(e) => { if (e.key === 'Enter') doSave(); }}
      />
      <button class="btn primary" onclick={doSave}>
        {lang === 'ru' ? 'Сохранить' : 'Save'}
      </button>
    </div>
    {#if savedList.length > 0}
      <ul class="builds-list">
        {#each savedList as s (s.name)}
          <li>
            <button class="load-btn" onclick={() => doLoad(s)}>
              <span class="l-name">{s.name}</span>
              <span class="l-date">{new Date(s.at).toLocaleDateString()}</span>
            </button>
            <button class="del-btn" onclick={() => doDelete(s.name)} title={lang === 'ru' ? 'Удалить' : 'Delete'}>×</button>
          </li>
        {/each}
      </ul>
    {:else}
      <div class="ha-note">{lang === 'ru' ? 'Пока нет сохранённых билдов' : 'No saved builds yet'}</div>
    {/if}
  </div>
{/if}

{#if authOpen}
  <div class="ha-overlay" onclick={closeOverlays} role="presentation"></div>
  <div class="ha-pop">
    <div class="ha-pop-title">
      {#if loggedIn}
        {lang === 'ru' ? 'Аккаунт' : 'Account'}
      {:else if authMode === 'login'}
        {lang === 'ru' ? 'Вход' : 'Sign in'}
      {:else}
        {lang === 'ru' ? 'Создание аккаунта' : 'Create account'}
      {/if}
    </div>
    {#if !loggedIn}
      <div class="ha-tabs">
        <button class="ha-tab" class:active={authMode === 'login'} onclick={() => (authMode = 'login')}>
          {lang === 'ru' ? '👤 Вход' : '👤 Sign in'}
        </button>
        <button class="ha-tab" class:active={authMode === 'register'} onclick={() => (authMode = 'register')}>
          {lang === 'ru' ? '✨ Регистрация' : '✨ Register'}
        </button>
      </div>
      <label>
        <span>{authMode === 'login' ? (lang === 'ru' ? 'Имя или email' : 'Username or email') : (lang === 'ru' ? 'Имя пользователя' : 'Username')}</span>
        <input class="input" type="text" bind:value={username} autocomplete="username" />
      </label>
      {#if authMode === 'register'}
        <label>
          <span>Email</span>
          <input class="input" type="email" bind:value={email} autocomplete="email" />
        </label>
      {/if}
      <label>
        <span>{lang === 'ru' ? 'Пароль' : 'Password'}</span>
        <input class="input" type="password" bind:value={pw} autocomplete={authMode === 'login' ? 'current-password' : 'new-password'} />
      </label>
      {#if authMode === 'register'}
        <label>
          <span>{lang === 'ru' ? 'Повтор пароля' : 'Confirm password'}</span>
          <input class="input" type="password" bind:value={pwConfirm} autocomplete="new-password" />
        </label>
      {/if}
      <button class="btn primary" disabled={busy} onclick={authMode === 'login' ? doLogin : doRegister}>
        {#if busy}…{:else if authMode === 'login'}{lang === 'ru' ? 'Войти' : 'Sign in'}{:else}{lang === 'ru' ? 'Создать аккаунт' : 'Create account'}{/if}
      </button>
      {#if loginMsg}<div class="ha-msg err">{loginMsg}</div>{/if}
      <div class="ha-note">🔒 {lang === 'ru' ? 'Данные на нашем сервере, без сторонних' : 'Data on our server, no 3rd parties'}</div>
    {:else}
      <div class="ha-row-wide"><span>{lang === 'ru' ? 'Вы вошли как' : 'Logged in as'}:</span> <b>{username}</b></div>
      <button class="btn danger" onclick={logout}>{lang === 'ru' ? 'Выйти' : 'Log out'}</button>
    {/if}
  </div>
{/if}

{#if bugOpen}
  <div class="ha-overlay" onclick={closeOverlays} role="presentation"></div>
  <div class="ha-pop">
    <div class="ha-pop-title">{lang === 'ru' ? 'Сообщить о баге' : 'Report a bug'}</div>
    <label>
      <span>{lang === 'ru' ? 'Заголовок' : 'Title'}</span>
      <input
        class="input"
        type="text"
        bind:value={bugTitle}
        placeholder={lang === 'ru' ? 'Краткое описание' : 'Short summary'}
      />
    </label>
    <label>
      <span>{lang === 'ru' ? 'Что произошло?' : 'What happened?'}</span>
      <textarea
        class="input"
        rows="5"
        bind:value={bugBody}
        placeholder={lang === 'ru' ? 'Шаги, что ожидал, что получилось...' : 'Steps to reproduce, expected vs actual...'}
      ></textarea>
    </label>
    <button class="btn primary" onclick={submitBug}>
      ↗ {lang === 'ru' ? 'Открыть в GitHub' : 'Open in GitHub'}
    </button>
    <div class="ha-note">{lang === 'ru' ? 'Нужен GitHub-аккаунт' : 'Needs a GitHub account'}</div>
  </div>
{/if}

<style>
  .ha-row { display: flex; gap: 6px; }
  .ha-btn {
    padding: 5px 10px;
    background: var(--bg-2); border: 1px solid var(--border);
    color: var(--muted);
    border-radius: 999px;
    cursor: pointer;
    font: 700 10px/1 var(--f-display); letter-spacing: .1em;
    text-transform: uppercase;
    transition: all .12s;
    display: inline-flex; align-items: center; gap: 5px;
  }
  .ha-btn:hover { border-color: var(--border-hi); color: var(--text); }
  .ha-btn.on {
    color: var(--orange); border-color: rgba(254,175,16,.5);
    background: rgba(254,175,16,.08);
  }
  .ha-btn.reg {
    color: var(--green, #01fe90); border-color: rgba(1,254,144,.4);
    background: rgba(1,254,144,.06);
  }
  .ha-btn.reg:hover {
    background: rgba(1,254,144,.15);
    border-color: var(--green, #01fe90);
  }
  .ha-btn.bug:hover { color: var(--red); border-color: rgba(239,83,80,.5); }
  .ha-btn.builds {
    color: var(--blue, #58a9ff); border-color: rgba(88,169,255,.4);
    background: rgba(88,169,255,.06);
  }
  .ha-btn.builds:hover { background: rgba(88,169,255,.15); border-color: var(--blue, #58a9ff); }
  .ha-btn .count {
    margin-left: 4px; padding: 2px 6px;
    background: var(--orange); color: #000;
    border-radius: 999px;
    font: 700 9px/1 var(--f-display);
    letter-spacing: 0;
  }
  .ha-pop.wide { width: 360px; max-height: 70vh; overflow-y: auto; }
  .save-row { display: grid; grid-template-columns: 1fr 100px; gap: 6px; }
  .save-row .input { padding: 6px 10px; font-size: 12px; }
  .builds-list { list-style: none; margin: 6px 0 0; padding: 0; display: flex; flex-direction: column; gap: 3px; }
  .builds-list li { display: flex; gap: 3px; }
  .load-btn {
    flex: 1; display: flex; justify-content: space-between; align-items: center;
    padding: 6px 10px;
    background: var(--bg-2); border: 1px solid var(--border);
    color: var(--text); border-radius: var(--r-sm);
    cursor: pointer; font-size: 11px;
  }
  .load-btn:hover { background: rgba(254,175,16,.08); border-color: rgba(254,175,16,.3); color: var(--orange-hi, #ffa500); }
  .l-name { font-weight: 600; }
  .l-date { font-size: 9px; color: var(--muted); font-family: var(--f-mono); }
  .del-btn {
    padding: 0 8px; background: transparent;
    border: 1px solid var(--border); color: var(--red);
    cursor: pointer; border-radius: var(--r-sm);
  }
  .del-btn:hover { background: rgba(255,94,98,.1); border-color: var(--red); }
  .ha-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,.3); z-index: 50;
  }
  .ha-pop {
    position: fixed; top: 70px; right: 20px;
    width: 320px; z-index: 51;
    background: var(--card); border: 1px solid var(--border);
    border-radius: var(--r); padding: 14px;
    display: flex; flex-direction: column; gap: 8px;
    box-shadow: 0 20px 40px rgba(0,0,0,.6);
  }
  .ha-pop-title {
    font: 700 11px/1 var(--f-display); letter-spacing: .14em;
    color: var(--orange); text-transform: uppercase;
    padding-bottom: 6px; border-bottom: 1px solid var(--border);
  }
  .ha-tabs { display: flex; gap: 4px; }
  .ha-tab {
    flex: 1; padding: 7px 10px;
    background: var(--bg-2); border: 1px solid var(--border);
    color: var(--muted);
    border-radius: var(--r);
    cursor: pointer;
    font: 700 9px/1 var(--f-display); letter-spacing: .1em;
    text-transform: uppercase;
    transition: all .12s;
  }
  .ha-tab:hover { border-color: var(--border-hi); color: var(--text-dim); }
  .ha-tab.active {
    background: var(--orange); color: #000; border-color: var(--orange);
  }
  .ha-pop label { display: flex; flex-direction: column; gap: 3px; }
  .ha-pop label span { font: 700 9px/1 var(--f-display); color: var(--muted); letter-spacing: .1em; text-transform: uppercase; }
  .ha-pop .input { padding: 6px 8px; font-size: 12px; }
  .ha-pop textarea.input { resize: vertical; min-height: 90px; font-family: var(--f-body); line-height: 1.4; }
  .ha-msg { font-size: 11px; color: var(--green); white-space: pre-wrap; word-break: break-word; }
  .ha-msg.err { color: #ff8080; }
  .ha-note { font-size: 10px; color: var(--muted); font-style: italic; }
  .ha-row-wide { font-size: 12px; color: var(--text-dim); }
  .ha-row-wide b { color: var(--text); }
  .btn.primary { background: var(--orange); border-color: var(--orange); color: #000; }
  .btn.primary:hover { background: #ffa726; }
  .btn.primary:disabled { opacity: .5; cursor: not-allowed; }
  .btn.danger { color: var(--red); border-color: rgba(239,83,80,.5); }

  @media (max-width: 700px) {
    .ha-pop { left: 10px; right: 10px; width: auto; top: 60px; }
    .ha-btn { padding: 4px 8px; font-size: 9px; }
  }
</style>
