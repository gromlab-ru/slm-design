# SLM Design

Документация и agent skill для архитектуры Scoped Layered Module Design.

## Структура

- `docs/` — новый нормативный корпус и материалы сайта.
- `old-docs/` — действующая legacy-документация для текущего skill.
- `site/` — VitePress-конфигурация, тема и статические ресурсы.
- `src-skills/` — исходники agent skills.
- `skills/` — собранные skills для установки через `npx skills`.

## Сборка

Требуется Node.js 20 или новее.

```bash
npm run build
npm run check
```

`npm run build` пересобирает текущий `skills/slm-design/` из `old-docs/` и `src-skills/slm-design/`. Не редактируй собранные файлы вручную.

## Установка

После публикации репозитория:

```bash
npx skills add <owner>/slm-design-new --skill slm-design
```
