# SLM Design

Документация и agent skill для архитектуры Scoped Layered Module Design.

## Структура

- `DRAFT/` - рабочая документация Levels 1-2, исследования Level 3 и источник содержимого сайта.
- `site/` - VitePress-конфигурация, тема и статические ресурсы.
- `docs/` и `docs-v3/` - архивные версии документации, не используемые сайтом.
- `old-docs/` - действующая legacy-документация для текущего skill.
- `src-skills/` - исходники agent skills.
- `skills/` - собранные skills для установки через `npx skills`.

## Сборка

Требуется Node.js 20 или новее.

```bash
npm run build
npm run check
```

`npm run build` пересобирает текущий `skills/slm-design/` из `old-docs/` и `src-skills/slm-design/`. `npm run check` дополнительно проверяет правила и собирает сайт из `DRAFT/`. Не редактируй собранные файлы вручную.

## Установка

После публикации репозитория:

```bash
npx skills add <owner>/slm-design-new --skill slm-design
```
