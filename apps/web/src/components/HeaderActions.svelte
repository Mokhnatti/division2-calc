<script lang="ts">
  import { lang as langState } from '../lang-state.svelte.js';

  let lang = $derived(langState.current);

  let username = $state('');
  let pw = $state('');
  let loggedIn = $state(false);
  let authOpen = $state(false);
  let bugOpen = $state(false);
  let bugTitle = $state('');
  let bugBody = $state('');
  let loginMsg = $state('');

  $effect(() => {
    try {
      const u = localStorage.getItem('divcalc:user');
      if (u) { username = u; loggedIn = true; }
    } catch { /* ignore */ }
  });

  function fakeLogin() {
    if (!username || !pw) {
      loginMsg = lang === 'en' ? 'Enter username and password' : 'Введи имя и пароль';
      return;
    }
    try { localStorage.setItem('divcalc:user', username); } catch { /* ignore */ }
    loggedIn = true;
    loginMsg = lang === 'en' ? 'Saved locally (backend TBD)' : 'Сохранено локально (backend скоро)';
    setTimeout(() => { authOpen = false; loginMsg = ''; }, 1000);
  }

  function logout() {
    try { localStorage.removeItem('divcalc:user'); } catch { /* ignore */ }
    loggedIn = false;
    username = '';
    pw = '';
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
  }
</script>

<div class="ha-row">
  <button
    class="ha-btn"
    class:on={loggedIn}
    onclick={() => { authOpen = !authOpen; bugOpen = false; }}
    title={loggedIn ? (lang === 'en' ? 'Profile' : 'Профиль') : (lang === 'en' ? 'Sign in' : 'Войти')}
  >
    👤 {loggedIn ? username : (lang === 'en' ? 'Sign in' : 'Войти')}
  </button>
  <button
    class="ha-btn bug"
    onclick={() => { bugOpen = !bugOpen; authOpen = false; }}
    title={lang === 'en' ? 'Bug report' : 'Сообщить о баге'}
  >
    🐛
  </button>
</div>

{#if authOpen}
  <div class="ha-overlay" onclick={closeOverlays} role="presentation"></div>
  <div class="ha-pop">
    <div class="ha-pop-title">
      {#if loggedIn}{lang === 'en' ? 'Account' : 'Аккаунт'}{:else}{lang === 'en' ? 'Sign in / Register' : 'Вход / Регистрация'}{/if}
    </div>
    {#if !loggedIn}
      <label>
        <span>{lang === 'en' ? 'Username' : 'Имя'}</span>
        <input class="input" type="text" bind:value={username} autocomplete="username" />
      </label>
      <label>
        <span>{lang === 'en' ? 'Password' : 'Пароль'}</span>
        <input class="input" type="password" bind:value={pw} autocomplete="current-password" />
      </label>
      <button class="btn primary" onclick={fakeLogin}>
        {lang === 'en' ? 'Sign in' : 'Войти'}
      </button>
      {#if loginMsg}<div class="ha-msg">{loginMsg}</div>{/if}
      <div class="ha-note">⚠ {lang === 'en' ? 'Local-only, backend TBD' : 'Локально, backend скоро'}</div>
    {:else}
      <div class="ha-row-wide"><span>{lang === 'en' ? 'Logged in as' : 'Вы вошли как'}:</span> <b>{username}</b></div>
      <button class="btn danger" onclick={logout}>{lang === 'en' ? 'Log out' : 'Выйти'}</button>
    {/if}
  </div>
{/if}

{#if bugOpen}
  <div class="ha-overlay" onclick={closeOverlays} role="presentation"></div>
  <div class="ha-pop">
    <div class="ha-pop-title">{lang === 'en' ? 'Report a bug' : 'Сообщить о баге'}</div>
    <label>
      <span>{lang === 'en' ? 'Title' : 'Заголовок'}</span>
      <input
        class="input"
        type="text"
        bind:value={bugTitle}
        placeholder={lang === 'en' ? 'Short summary' : 'Краткое описание'}
      />
    </label>
    <label>
      <span>{lang === 'en' ? 'What happened?' : 'Что произошло?'}</span>
      <textarea
        class="input"
        rows="5"
        bind:value={bugBody}
        placeholder={lang === 'en'
          ? 'Steps to reproduce, expected vs actual...'
          : 'Шаги, что ожидал, что получилось...'}
      ></textarea>
    </label>
    <button class="btn primary" onclick={submitBug}>
      ↗ {lang === 'en' ? 'Open in GitHub' : 'Открыть в GitHub'}
    </button>
    <div class="ha-note">{lang === 'en' ? 'Needs a GitHub account' : 'Нужен GitHub-аккаунт'}</div>
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
  .ha-btn.bug:hover { color: var(--red); border-color: rgba(239,83,80,.5); }
  .ha-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,.3); z-index: 50;
  }
  .ha-pop {
    position: fixed; top: 70px; right: 20px;
    width: 300px; z-index: 51;
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
  .ha-pop label { display: flex; flex-direction: column; gap: 3px; }
  .ha-pop label span { font: 700 9px/1 var(--f-display); color: var(--muted); letter-spacing: .1em; text-transform: uppercase; }
  .ha-pop .input { padding: 6px 8px; font-size: 12px; }
  .ha-pop textarea.input { resize: vertical; min-height: 90px; font-family: var(--f-body); line-height: 1.4; }
  .ha-msg { font-size: 11px; color: var(--green); }
  .ha-note { font-size: 10px; color: var(--muted); font-style: italic; }
  .ha-row-wide { font-size: 12px; color: var(--text-dim); }
  .ha-row-wide b { color: var(--text); }
  .btn.primary { background: var(--orange); border-color: var(--orange); color: #000; }
  .btn.primary:hover { background: #ffa726; }
  .btn.danger { color: var(--red); border-color: rgba(239,83,80,.5); }

  @media (max-width: 700px) {
    .ha-pop { left: 10px; right: 10px; width: auto; top: 60px; }
    .ha-btn { padding: 4px 8px; font-size: 9px; }
  }
</style>
