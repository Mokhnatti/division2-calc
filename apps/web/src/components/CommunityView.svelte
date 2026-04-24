<script lang="ts">
  import { lang as langState } from '../lang-state.svelte.js';

  let lang = $derived(langState.current);

  type Tab = 'feed' | 'auth' | 'bug';
  let tab = $state<Tab>('feed');

  // Auth state (local only — real backend TBD)
  let username = $state('');
  let pw = $state('');
  let loggedIn = $state(false);
  let loginMsg = $state('');

  // Bug report fields
  let bugTitle = $state('');
  let bugBody = $state('');

  try {
    const u = localStorage.getItem('divcalc:user');
    if (u) { username = u; loggedIn = true; }
  } catch {
    // ignore
  }

  function fakeLogin() {
    if (!username || !pw) {
      loginMsg = lang === 'en' ? 'Enter username and password' : 'Введи имя и пароль';
      return;
    }
    try { localStorage.setItem('divcalc:user', username); } catch { /* ignore */ }
    loggedIn = true;
    loginMsg = lang === 'en' ? 'Local profile saved (no backend yet).' : 'Локальный профиль сохранён (backend ещё не запущен).';
  }

  function logout() {
    try { localStorage.removeItem('divcalc:user'); } catch { /* ignore */ }
    loggedIn = false;
    username = '';
    pw = '';
    loginMsg = '';
  }

  function openBugReport() {
    const title = encodeURIComponent(bugTitle || 'Bug report from user');
    const body = encodeURIComponent(
      (bugBody || '') +
      `\n\n---\nUrl: ${location.href}\nUser agent: ${navigator.userAgent}\nLang: ${lang}\n`
    );
    const url = `https://github.com/Mokhnatti/division2-calc/issues/new?title=${title}&body=${body}&labels=user-report`;
    window.open(url, '_blank', 'noopener');
  }
</script>

<section class="panel c-header">
  <div class="panel-title">
    <span>{lang === 'en' ? 'Community' : 'Сообщество'}</span>
    {#if loggedIn}
      <span class="chip user">👤 {username}</span>
    {/if}
  </div>
  <div class="c-tabs">
    <button class="c-tab" class:active={tab === 'feed'} onclick={() => (tab = 'feed')}>
      {lang === 'en' ? '📰 Feed' : '📰 Лента'}
    </button>
    <button class="c-tab" class:active={tab === 'auth'} onclick={() => (tab = 'auth')}>
      {lang === 'en' ? '👤 Profile' : '👤 Профиль'}
    </button>
    <button class="c-tab" class:active={tab === 'bug'} onclick={() => (tab = 'bug')}>
      {lang === 'en' ? '🐛 Bug Report' : '🐛 Сообщить о баге'}
    </button>
  </div>
</section>

{#if tab === 'feed'}
  <section class="panel">
    <div class="panel-title"><span>{lang === 'en' ? 'Shared builds' : 'Опубликованные билды'}</span></div>
    <div class="empty">
      <div class="emoji">🛠</div>
      <div class="msg">
        {lang === 'en'
          ? 'Build feed coming with v2.1 backend. For now — share builds via URL.'
          : 'Лента билдов появится в v2.1 с бэкендом. Пока — делись билдом через Share URL.'}
      </div>
      <div class="hint">
        {lang === 'en'
          ? 'Tip: open the Build tab, configure, click "Share" — URL copied to clipboard.'
          : 'Подсказка: вкладка Билд → настрой → кнопка "Share" → ссылка в буфере.'}
      </div>
    </div>
  </section>
{:else if tab === 'auth'}
  <section class="panel">
    <div class="panel-title"><span>{lang === 'en' ? 'Account' : 'Аккаунт'}</span></div>
    {#if !loggedIn}
      <div class="auth-form">
        <label>
          <span>{lang === 'en' ? 'Username' : 'Имя пользователя'}</span>
          <input class="input" type="text" bind:value={username} autocomplete="username" />
        </label>
        <label>
          <span>{lang === 'en' ? 'Password' : 'Пароль'}</span>
          <input class="input" type="password" bind:value={pw} autocomplete="current-password" />
        </label>
        <button class="btn" onclick={fakeLogin}>
          {lang === 'en' ? 'Log In / Register' : 'Войти / Зарегистрироваться'}
        </button>
        {#if loginMsg}<div class="auth-msg">{loginMsg}</div>{/if}
        <div class="disclaimer">
          {lang === 'en'
            ? '⚠ No real backend yet. Username stored locally only. Real auth + shared builds coming in v2.1.'
            : '⚠ Реальный backend пока не запущен. Имя хранится локально. Настоящая авторизация + сохранение билдов — в v2.1.'}
        </div>
      </div>
    {:else}
      <div class="profile">
        <div class="p-row"><span class="pk">{lang === 'en' ? 'Logged in as' : 'Вошёл как'}:</span> <b>{username}</b></div>
        <div class="p-row"><span class="pk">{lang === 'en' ? 'Storage' : 'Хранение'}:</span> localStorage only</div>
        <div class="p-row"><span class="pk">{lang === 'en' ? 'Saved builds' : 'Сохранённые билды'}:</span> {lang === 'en' ? 'coming soon' : 'скоро'}</div>
        <button class="btn danger" onclick={logout}>{lang === 'en' ? 'Log Out' : 'Выйти'}</button>
      </div>
    {/if}
  </section>
{:else if tab === 'bug'}
  <section class="panel">
    <div class="panel-title"><span>{lang === 'en' ? 'Report a Bug' : 'Сообщить о баге'}</span></div>
    <div class="bug-form">
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
        <span>{lang === 'en' ? 'Describe what happened' : 'Опиши что произошло'}</span>
        <textarea
          class="input"
          rows="6"
          bind:value={bugBody}
          placeholder={lang === 'en'
            ? 'Steps to reproduce, expected vs actual...'
            : 'Что делал, что ожидал, что получилось...'}
        ></textarea>
      </label>
      <div class="bug-actions">
        <button class="btn" onclick={openBugReport}>
          {lang === 'en' ? '↗ Open in GitHub Issues' : '↗ Открыть в GitHub Issues'}
        </button>
      </div>
      <div class="hint">
        {lang === 'en'
          ? 'Opens github.com/Mokhnatti/division2-calc/issues pre-filled. You need a GitHub account to submit.'
          : 'Откроет github.com/Mokhnatti/division2-calc/issues с заполненным шаблоном. Для отправки нужен GitHub-аккаунт.'}
      </div>
    </div>
  </section>
{/if}

<style>
  .c-header { max-width: 900px; margin: 0 auto 12px; }
  section.panel { max-width: 900px; margin: 0 auto 14px; }
  .chip.user { font-size: 11px; color: var(--named); background: rgba(254,175,16,.08); padding: 3px 10px; border-radius: 999px; border: 1px solid rgba(254,175,16,.3); }

  .c-tabs { display: flex; gap: 4px; }
  .c-tab {
    padding: 7px 14px;
    background: var(--bg-2); border: 1px solid var(--border);
    color: var(--muted);
    border-radius: var(--r);
    cursor: pointer;
    font: 700 10px/1 var(--f-display); letter-spacing: .1em;
    text-transform: uppercase;
    transition: all .12s;
  }
  .c-tab:hover { border-color: var(--border-hi); color: var(--text-dim); }
  .c-tab.active {
    background: var(--orange);
    color: #000;
    border-color: var(--orange);
  }

  .empty { padding: 40px 20px; text-align: center; }
  .empty .emoji { font-size: 40px; margin-bottom: 12px; }
  .empty .msg { color: var(--text-dim); font-size: 13px; margin-bottom: 10px; line-height: 1.5; }
  .empty .hint { font-size: 11px; color: var(--muted); font-style: italic; }

  .auth-form { display: flex; flex-direction: column; gap: 10px; max-width: 360px; }
  .auth-form label { display: flex; flex-direction: column; gap: 4px; }
  .auth-form label span { font: 700 9px/1 var(--f-display); color: var(--muted); letter-spacing: .1em; text-transform: uppercase; }
  .auth-msg { font-size: 11px; color: var(--green); }
  .disclaimer { font-size: 10px; color: var(--orange); margin-top: 6px; font-style: italic; background: rgba(254,175,16,.05); padding: 8px; border-radius: var(--r-sm); border-left: 3px solid var(--orange); }

  .profile { display: flex; flex-direction: column; gap: 8px; }
  .p-row { font-size: 12px; color: var(--text-dim); }
  .pk { color: var(--muted); font-weight: 600; }

  .bug-form { display: flex; flex-direction: column; gap: 10px; }
  .bug-form label { display: flex; flex-direction: column; gap: 4px; }
  .bug-form label span { font: 700 9px/1 var(--f-display); color: var(--muted); letter-spacing: .1em; text-transform: uppercase; }
  textarea.input { font-family: var(--f-body); line-height: 1.5; resize: vertical; min-height: 120px; padding: 8px; }
  .bug-actions { display: flex; gap: 6px; }
  .hint { font-size: 10px; color: var(--muted); font-style: italic; }
</style>
