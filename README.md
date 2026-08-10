# SLM Design

Документация и agent skill для архитектуры Scoped Layered Module Design.

## Структура

- `docs/` - документация SLM и единственный источник содержимого сайта и reference-материалов skill.
- `site/` - VitePress-рендерер: конфигурация, тема и статические ресурсы без собственной копии документации.
- `old-docs/` - архив legacy-документации, не используемый текущим skill.
- `src-skills/` - исходники agent skills.
- `skills/` - собранные skills для установки через `npx skills`.

## Сборка

Требуется Node.js 20 или новее.

```bash
npm run build:skill
npm run check:skill
npm run check:docs
npm run check:site
npm run check
```

`npm run check:docs` проверяет правила и ссылки документации. `npm run check:site` собирает VitePress из `docs/` и проверяет опубликованные страницы. Skill собирается из `src-skills/slm-design/`, а всё дерево `docs/` рекурсивно включается в `skills/slm-design/reference/docs/`. Собранные файлы не редактируются вручную.

## Установка

После публикации репозитория:

```bash
npx skills add gromlab-ru/slm-design --skill slm-design
```
