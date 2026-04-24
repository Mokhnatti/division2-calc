<script lang="ts">
  import { lang as langState } from '../lang-state.svelte.js';

  let lang = $derived(langState.current);

  type Tab = 'feed' | 'auth' | 'bug';
  let tab = $state<Tab>('feed');

  // Auth state via PocketBase (/api/collections/users)
  let username = $state('');
  let email = $state('');
  let pw = $state('');
  let pwConfirm = $state('');
  let loggedIn = $state(false);
  let loginMsg = $state('');
  let busy = $state(false);
  let authMode = $state<'login' | 'register'>('login');

  let bugTitle = $state('');
  let bugBody = $state('');

  try {
    const raw = localStorage.getItem('divcalc:auth');
    if (raw) {
      const a = JSON.parse(raw);
      if (a?.token && a?.username) {
        username = a.username;
        loggedIn = true;
      }
    }
  } catch {
    // ignore
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
      loginMsg = lang === 'ru' ? 'Вошёл в аккаунт.' : 'Signed in.';
      pw = '';
    } catch (e) {
      loginMsg = (lang === 'ru' ? 'Ошибка сети: ' : 'Network error: ') + String(e);
    } finally {
      busy = false;
    }
  }

  async function doRegister() {
    if (!username || !email || !pw || !pwConfirm) {
      loginMsg = lang === 'ru' ? 'Заполни имя, email, пароль, подтверждение' : 'Fill username, email, password, confirm';
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
        loginMsg = (lang === 'ru' ? 'Не удалось зарегистрироваться: ' : 'Register failed: ') + (fieldErr || j?.message || r.status);
        return;
      }
      // Auto-login right after register
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
    <span>{lang === 'ru' ? 'Сообщество' : 'Community'}</span>
    {#if loggedIn}
      <span class="chip user">👤 {username}</span>
    {/if}
  </div>
  <div class="c-tabs">
    <button class="c-tab" class:active={tab === 'feed'} onclick={() => (tab = 'feed')}>
      {lang === 'ru' ? '📰 Лента' : '📰 Feed'}
    </button>
    <button class="c-tab" class:active={tab === 'auth'} onclick={() => (tab = 'auth')}>
      {lang === 'ru' ? '👤 Профиль' : '👤 Profile'}
    </button>
    <button class="c-tab" class:active={tab === 'bug'} onclick={() => (tab = 'bug')}>
      {lang === 'ru' ? '🐛 Сообщить о баге' : '🐛 Bug Report'}
    </button>
  </div>
</section>

{#if tab === 'feed'}
  <section class="panel">
    <div class="panel-title"><span>{lang === 'ru' ? 'Опубликованные билды' : 'Shared builds'}</span></div>
    <div class="empty">
      <div class="emoji">🛠</div>
      <div class="msg">
        {lang === 'ru' ? 'Лента билдов появится в v2.1 с бэкендом. Пока — делись билдом через Share URL.' : 'Build feed coming with v2.1 backend. For now — share builds via URL.'}
      </div>
      <div class="hint">
        {lang === 'ru' ? 'Подсказка: вкладка Билд → настрой → кнопка "Share" → ссылка в буфере.' : 'Tip: open the Build tab, configure, click "Share" — URL copied to clipboard.'}
      </div>
    </div>
  </section>
{:else if tab === 'auth'}
  <section class="panel">
    <div class="panel-title"><span>{lang === 'ru' ? 'Аккаунт' : 'Account'}</span></div>
    {#if !loggedIn}
      <div class="auth-form">
        <div class="auth-tabs">
          <button class="at-tab" class:active={authMode === 'login'} onclick={() => (authMode = 'login')}>
            {lang === 'ru' ? '👤 Вход' : '👤 Log In'}
          </button>
          <button class="at-tab" class:active={authMode === 'register'} onclick={() => (authMode = 'register')}>
            {lang === 'ru' ? '✨ Регистрация' : '✨ Register'}
          </button>
        </div>
        <label>
          <span>{lang === 'en'
            ? (authMode === 'login' ? 'Username or email' : 'Username')
            : (authMode === 'login' ? 'Имя или email' : 'Имя пользователя')}</span>
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
          {#if busy}…{:else if authMode === 'login'}{lang === 'ru' ? 'Войти' : 'Log In'}{:else}{lang === 'ru' ? 'Создать аккаунт' : 'Create Account'}{/if}
        </button>
        {#if loginMsg}<div class="auth-msg">{loginMsg}</div>{/if}
        <div class="disclaimer">
          {lang === 'ru' ? 'На базе PocketBase. Данные хранятся на нашем сервере, без сторонних сервисов.' : 'Powered by PocketBase. Data lives on our server — no 3rd parties.'}
        </div>
      </div>
    {:else}
      <div class="profile">
        <div class="p-row"><span class="pk">{lang === 'ru' ? 'Вошёл как' : 'Logged in as'}:</span> <b>{username}</b></div>
        <div class="p-row"><span class="pk">{lang === 'ru' ? 'Хранение' : 'Storage'}:</span> PocketBase (divcalc.xyz)</div>
        <div class="p-row"><span class="pk">{lang === 'ru' ? 'Сохранённые билды' : 'Saved builds'}:</span> {lang === 'ru' ? 'скоро' : 'coming soon'}</div>
        <button class="btn danger" onclick={logout}>{lang === 'ru' ? 'Выйти' : 'Log Out'}</button>
      </div>
    {/if}
  </section>
{:else if tab === 'bug'}
  <section class="panel">
    <div class="panel-title"><span>{lang === 'ru' ? 'Сообщить о баге' : 'Report a Bug'}</span></div>
    <div class="bug-form">
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
        <span>{lang === 'ru' ? 'Опиши что произошло' : 'Describe what happened'}</span>
        <textarea
          class="input"
          rows="6"
          bind:value={bugBody}
          placeholder={lang === 'ru' ? 'Что делал, что ожидал, что получилось...' : 'Steps to reproduce, expected vs actual...'}
        ></textarea>
      </label>
      <div class="bug-actions">
        <button class="btn" onclick={openBugReport}>
          {lang === 'ru' ? '↗ Открыть в GitHub Issues' : '↗ Open in GitHub Issues'}
        </button>
      </div>
      <div class="hint">
        {lang === 'ru' ? 'Откроет github.com/Mokhnatti/division2-calc/issues с заполненным шаблоном. Для отправки нужен GitHub-аккаунт.' : 'Opens github.com/Mokhnatti/division2-calc/issues pre-filled. You need a GitHub account to submit.'}
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
  .auth-msg { font-size: 11px; color: var(--green); white-space: pre-wrap; word-break: break-word; }
  .auth-tabs { display: flex; gap: 4px; margin-bottom: 4px; }
  .at-tab {
    flex: 1;
    padding: 8px 10px;
    background: var(--bg-2); border: 1px solid var(--border);
    color: var(--muted);
    border-radius: var(--r);
    cursor: pointer;
    font: 700 10px/1 var(--f-display); letter-spacing: .1em;
    text-transform: uppercase;
    transition: all .12s;
  }
  .at-tab:hover { border-color: var(--border-hi); color: var(--text-dim); }
  .at-tab.active { background: var(--orange); color: #000; border-color: var(--orange); }
  .btn.primary { background: var(--orange); color: #000; border-color: var(--orange); padding: 9px 14px; font-weight: 700; }
  .btn.primary:hover { background: var(--orange-hi, #ffa500); }
  .btn:disabled { opacity: .5; cursor: not-allowed; }
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
