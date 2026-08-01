# SLM Design

Документация и agent skill для архитектуры Scoped Layered Module Design.

## Структура

- `DRAFT/` - рабочая документация Levels 1-2, источник содержимого сайта и bundled references текущего skill.
- `site/` - VitePress-конфигурация, тема и статические ресурсы.
- `docs/` и `docs-v3/` - архивные версии документации, не используемые сайтом.
- `old-docs/` - архив legacy-документации, не используемый текущим skill.
- `src-skills/` - исходники agent skills.
- `skills/` - собранные skills для установки через `npx skills`.

## Сборка

Требуется Node.js 20 или новее.

```bash
npm run build:skill
npm run check:skill
npm run check
```

`npm run build:skill` детерминированно пересобирает `skills/slm-design/` из `src-skills/slm-design/` и `DRAFT/`. `npm run check:skill` ничего не изменяет и проверяет, что tracked-артефакт актуален, ссылки разрешаются, а legacy references отсутствуют. `npm run check` дополнительно проверяет правила и собирает сайт. Не редактируй собранные файлы вручную.

## Установка

После публикации репозитория:

```bash
npx skills add <owner>/slm-design-new --skill slm-design
```
