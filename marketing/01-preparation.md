# Этап 1: Подготовка (неделя 1)

## ✅ SEO Meta (done)
- Title: "Division 2 Калькулятор — Билды, Оружие, Таланты на русском | divcalc.xyz"
- Description с ключевыми словами
- OG теги для Facebook/Telegram/VK превью
- Twitter Card
- Schema.org WebApplication разметка
- Canonical URL
- hreflang для RU/EN

## ✅ robots.txt + sitemap.xml (done)
- Разрешена индексация
- Запрещён data_sources/ и scripts/
- Sitemap указан

## ⏳ TODO
### 1. Favicon
- Создать 32x32 PNG с символом Division 2 (оранжевый круг с треугольником?)
- Положить в `favicon.png` в корне
- Можно взять официальную иконку Division 2 SHD

### 2. OG image
- 1200x630 PNG баннер для превью в соцсетях
- Содержание: логотип + "Калькулятор билдов Division 2" + скриншот UI
- Путь: `og-image.png` в корне

### 3. Google Analytics 4
```html
<!-- В <head>, после остальных meta -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXX');
</script>
```
- Зарегистрировать на https://analytics.google.com
- Создать property "Division 2 Calc"
- Получить Measurement ID (G-XXXXXX)
- Вставить в index.html

### 4. Share-ссылки для билдов
JavaScript функция в js/main.js:
```javascript
function generateShareLink() {
  const params = new URLSearchParams();
  params.set('weapon', currentWeapon);
  params.set('talent', currentTalent);
  params.set('brand', currentBrand);
  params.set('mode', currentMode);
  return `https://divcalc.xyz/?${params.toString()}`;
}

function copyShareLink() {
  navigator.clipboard.writeText(generateShareLink());
  showToast('Ссылка скопирована!');
}
```
+ кнопка "📤 Поделиться билдом" в UI

### 5. Скриншоты для постов
Сделать 5 скриншотов:
1. Главная страница с общим видом
2. Сравнение талантов
3. Фильтр по именным вещам
4. Выбор оружия
5. Описание таланта (hover/tooltip)

Сохранить в `marketing/screenshots/`

## Deadline
Конец первой недели — всё готово к запуску Этапа 2.
