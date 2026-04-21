# Deploy / VPS config

Файлы в этой папке — **копии конфига VPS** для backup и истории.
Они **НЕ деплоятся автоматически** — просто лежат как reference.

## Caddyfile

Конфиг веб-сервера Caddy 2.11 на VPS Timeweb (89.223.65.56).

**Путь на VPS:** `/etc/caddy/Caddyfile`

Что делает:
- Отдаёт статику из `/var/www/divcalc/`
- `/api/*` → PocketBase (127.0.0.1:8090)
- SEO-файлы (robots.txt, sitemap.xml, llms.txt, yandex_*.html, BingSiteAuth.xml) — с правильным Content-Type, без Alt-Svc
- `try_files {path} {path}.html /index.html` — это чтобы `/exotic/eagle-bearer` находил `/var/www/divcalc/exotic/eagle-bearer.html`
- Bot UA-matching → prerender для SEO

## Применение

После правки локально:
```bash
scp deploy/Caddyfile root@89.223.65.56:/etc/caddy/Caddyfile
ssh root@89.223.65.56 'caddy validate --config /etc/caddy/Caddyfile && systemctl reload caddy'
```

## Auto-pull cron

`/usr/local/bin/divcalc-pull.sh` (на VPS) — каждые 5 минут делает `git pull` в `/var/www/divcalc/`.
