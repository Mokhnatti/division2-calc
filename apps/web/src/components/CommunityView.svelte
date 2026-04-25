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
  // Bug form (v1-compatible, Formspree-based — no GitHub account needed)
  const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mlgadraa';
  let bugType = $state('');
  let bugItem = $state('');
  let bugSlot = $state('');
  let bugContact = $state('');
  let bugStatus = $state<'idle' | 'sending' | 'ok' | 'err'>('idle');
  let bugStatusMsg = $state('');

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

  async function submitBugForm() {
    if (!bugType || !bugBody.trim()) {
      bugStatus = 'err';
      bugStatusMsg = lang === 'ru' ? 'Заполни тип и описание' : 'Fill type and description';
      return;
    }
    bugStatus = 'sending';
    bugStatusMsg = lang === 'ru' ? 'Отправка...' : 'Sending...';
    try {
      const payload = {
        type: bugType,
        item: bugItem,
        slot: bugSlot,
        title: bugTitle,
        description: bugBody,
        contact: bugContact,
        page_url: location.href,
        user_agent: navigator.userAgent,
        _subject: 'Division 2 Calc — баг-репорт',
      };
      const r = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (r.ok) {
        bugStatus = 'ok';
        bugStatusMsg = lang === 'ru' ? '✅ Отправлено, спасибо!' : '✅ Sent, thanks!';
        bugType = ''; bugItem = ''; bugSlot = ''; bugTitle = ''; bugBody = ''; bugContact = '';
      } else {
        const j = await r.json().catch(() => ({}));
        bugStatus = 'err';
        const errMsg = (j as { error?: string; errors?: Array<{ message: string }> }).error
          || (j as { errors?: Array<{ message: string }> }).errors?.map(e => e.message).join(', ')
          || String(r.status);
        bugStatusMsg = (lang === 'ru' ? 'Ошибка: ' : 'Error: ') + errMsg;
      }
    } catch (e) {
      bugStatus = 'err';
      bugStatusMsg = (lang === 'ru' ? 'Сеть: ' : 'Network: ') + String(e);
    }
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
    <div class="panel-title"><span>{lang === 'ru' ? '🐛 Сообщить о баге' : '🐛 Report a Bug'}</span></div>
    <div class="bug-form">
      <label>
        <span>{lang === 'ru' ? 'Тип проблемы *' : 'Problem type *'}</span>
        <select class="input" bind:value={bugType}>
          <option value="">{lang === 'ru' ? '— выбери —' : '— pick —'}</option>
          <option value="math">{lang === 'ru' ? 'Неверная математика / DPS' : 'Wrong math / DPS'}</option>
          <option value="set-bonus">{lang === 'ru' ? 'Неверный бонус сета' : 'Wrong set bonus'}</option>
          <option value="talent">{lang === 'ru' ? 'Неверный талант / описание' : 'Wrong talent / description'}</option>
          <option value="missing">{lang === 'ru' ? 'Не хватает предмета в базе' : 'Missing item in DB'}</option>
          <option value="typo">{lang === 'ru' ? 'Опечатка / перевод' : 'Typo / translation'}</option>
          <option value="ui">{lang === 'ru' ? 'UI / не работает' : 'UI / broken'}</option>
          <option value="other">{lang === 'ru' ? 'Другое' : 'Other'}</option>
        </select>
      </label>
      <div class="bug-row">
        <label>
          <span>{lang === 'ru' ? 'Предмет / сет / оружие' : 'Item / set / weapon'}</span>
          <input class="input" type="text" bind:value={bugItem}
            placeholder={lang === 'ru' ? 'например: Уравнитель, Боевик, Iron Lung' : 'e.g. Equalizer, Strikers, Iron Lung'} />
        </label>
        <label>
          <span>{lang === 'ru' ? 'Слот' : 'Slot'}</span>
          <select class="input" bind:value={bugSlot}>
            <option value="">—</option>
            <option value="mask">{lang === 'ru' ? 'Маска' : 'Mask'}</option>
            <option value="chest">{lang === 'ru' ? 'Нагрудник' : 'Chest'}</option>
            <option value="bp">{lang === 'ru' ? 'Рюкзак' : 'Backpack'}</option>
            <option value="gloves">{lang === 'ru' ? 'Перчатки' : 'Gloves'}</option>
            <option value="holster">{lang === 'ru' ? 'Кобура' : 'Holster'}</option>
            <option value="knees">{lang === 'ru' ? 'Наколенники' : 'Kneepads'}</option>
            <option value="weapon">{lang === 'ru' ? 'Оружие' : 'Weapon'}</option>
          </select>
        </label>
      </div>
      <label>
        <span>{lang === 'ru' ? 'Заголовок' : 'Title'}</span>
        <input class="input" type="text" bind:value={bugTitle}
          placeholder={lang === 'ru' ? 'Краткое описание (опционально)' : 'Short summary (optional)'} />
      </label>
      <label>
        <span>{lang === 'ru' ? 'Описание * (что показывает / что должно быть)' : 'Description * (what shows / what should be)'}</span>
        <textarea class="input" rows="5" bind:value={bugBody}
          placeholder={lang === 'ru' ? 'Например: у Iron Lung неверный талант, должен быть Ardent (Пылкость), а показывает Стойкость изгоев. Источник: ...' : 'Example: Iron Lung has wrong talent, should be Ardent, shows Outcast Resilience. Source: ...'}></textarea>
      </label>
      <label>
        <span>{lang === 'ru' ? 'Контакт (ник / email / telegram, опционально)' : 'Contact (nickname / email / telegram, optional)'}</span>
        <input class="input" type="text" bind:value={bugContact} placeholder="@nick / email" />
      </label>
      <div class="priority-box">
        ⚡ {lang === 'ru'
          ? 'Хочешь оперативное исправление? Отправляй на GitHub — там я вижу сразу. Почта проверяется реже.'
          : 'Want quick fix? Submit on GitHub — I see it immediately. Email is checked less often.'}
      </div>
      <div class="bug-actions">
        <button class="btn-github" onclick={openBugReport}>
          ↗ {lang === 'ru' ? 'Отправить на GitHub' : 'Submit to GitHub'}
          <span class="badge-fast">{lang === 'ru' ? '⚡ БЫСТРО' : '⚡ FAST'}</span>
        </button>
        <button class="btn-email" onclick={submitBugForm} disabled={bugStatus === 'sending'}>
          {bugStatus === 'sending' ? '...' : (lang === 'ru' ? '✉ Отправить по почте' : '✉ Submit via Email')}
        </button>
      </div>
      {#if bugStatusMsg}
        <div class="bug-status-msg" class:ok={bugStatus === 'ok'} class:err={bugStatus === 'err'}>{bugStatusMsg}</div>
      {/if}
      <div class="hint">
        {lang === 'ru'
          ? 'GitHub — нужен бесплатный аккаунт, я получаю мгновенно. Почта — без аккаунта через Formspree, но я смотрю реже.'
          : 'GitHub — free account, I get notified instantly. Email — no account via Formspree, but I check less often.'}
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

  .bug-form { display: flex; flex-direction: column; gap: 10px; max-width: 540px; }
  .bug-form label { display: flex; flex-direction: column; gap: 4px; flex: 1; }
  .bug-form label span { font: 700 9px/1 var(--f-display); color: var(--muted); letter-spacing: .1em; text-transform: uppercase; }
  .bug-row { display: flex; gap: 8px; }
  textarea.input { font-family: var(--f-body); line-height: 1.5; resize: vertical; min-height: 100px; padding: 8px; }
  .bug-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: stretch; }
  .priority-box {
    padding: 12px 14px;
    background: linear-gradient(135deg, rgba(254,175,16,.10), rgba(254,175,16,.04));
    border: 1px solid rgba(254,175,16,.4);
    border-left: 4px solid var(--orange);
    border-radius: var(--r);
    color: var(--text);
    font-size: 12px;
    font-weight: 500;
    line-height: 1.5;
    margin: 6px 0;
  }
  .btn-github {
    flex: 2;
    min-width: 240px;
    padding: 14px 20px;
    background: linear-gradient(135deg, #ff9500, #ff6f00);
    border: 2px solid #ff9500;
    color: #000;
    font: 700 13px/1 var(--f-display);
    letter-spacing: .12em;
    text-transform: uppercase;
    border-radius: var(--r);
    cursor: pointer;
    box-shadow: 0 2px 12px rgba(255,149,0,.35);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: transform .12s, box-shadow .12s;
  }
  .btn-github:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 18px rgba(255,149,0,.55);
  }
  .badge-fast {
    background: #000;
    color: #ffcc00;
    padding: 3px 8px;
    font-size: 10px;
    border-radius: 4px;
    letter-spacing: .08em;
    font-weight: 700;
  }
  .btn-email {
    flex: 1;
    min-width: 160px;
    padding: 10px 14px;
    background: var(--bg-2);
    border: 1px solid var(--border);
    color: var(--muted);
    font: 600 11px/1 var(--f-display);
    letter-spacing: .08em;
    text-transform: uppercase;
    border-radius: var(--r);
    cursor: pointer;
    transition: all .12s;
  }
  .btn-email:hover { border-color: var(--border-hi); color: var(--text-dim); }
  .btn-email:disabled { opacity: .5; cursor: not-allowed; }
  .bug-status-msg { padding: 8px 10px; border-radius: 5px; font-size: 11px; line-height: 1.4; }
  .bug-status-msg.ok { background: rgba(16, 200, 80, .12); color: var(--green, #10c850); border-left: 3px solid var(--green, #10c850); }
  .bug-status-msg.err { background: rgba(239, 83, 80, .12); color: var(--red, #ef5350); border-left: 3px solid var(--red, #ef5350); }
  .hint { font-size: 10px; color: var(--muted); font-style: italic; }
</style>
