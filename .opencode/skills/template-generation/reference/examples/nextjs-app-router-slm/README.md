# Шаблоны Next.js App Router + SLM

Пример содержит рабочую папку `.templates/` для генерации повторяемых SLM-сущностей через `@gromlab/create` или VS Code Template File Generator.

Перед использованием скопируй `.templates/` в нужную область проекта: приложение, пакет или самостоятельный участок монорепозитория.

Запускай CLI из каталога области, где лежит `.templates/`:

```bash
npx @gromlab/create <template> <name> [path]
```

Позиционный `[path]` - путь вывода относительно текущей рабочей директории, а не путь к шаблонам.

## Шаблоны

| Шаблон | Для чего | Куда генерировать |
|---|---|---|
| `component` | Презентационный компонент внутри `ui/` родительского модуля. Не владеет данными, сценариями и вложенной архитектурой. | `*/ui` |
| `module` | Обычный SLM-модуль с корневым `.tsx`, стилями, типами и публичным API. Подходит для `parts/` и UI-модулей слоя `src/ui`. | `*/parts`, `src/ui` |
| `screen` | Корневой screen-модуль страницы. | `src/compositions/screens` |
| `layout` | Layout-модуль композиции страницы. | `src/compositions/layouts` |
| `widget` | Переиспользуемый composition widget, не привязанный к одной странице. | `src/compositions/widgets` |
| `business` | Business-домен без runtime-зависимостей на другие домены. | `src/business` |
| `business-with-deps` | Business-домен с runtime-зависимостями, которые передаются через аргумент фабрики. | `src/business` |
| `store` | Zustand store внутри сегмента `stores/` конкретного модуля. | `*/stores` |
| `page-entry` | CMS-specific entry point для страницы, которая рендерится через dynamic routing. | `src/compositions/page-entries` |
| `business-composition` | Provider, hook и типы для передачи собранного business API внутри composition module. | внутри `src/compositions/**/<module>` |

## Компонент И Модуль

`component` создаёт презентационную единицу внутри сегмента `ui/`. Такой компонент работает только в границе родительского модуля и не импортирует проектный код за его пределами.

`module` создаёт архитектурную единицу SLM. У модуля есть публичный API через `index.ts`; он может иметь свои `hooks/`, `stores/`, `services/`, `parts/`, `ui/`, `types/` и `styles/` по мере необходимости.

Если UI-сущности нужны данные, сценарная логика, вложенные модули или собственные зависимости, используй `module`, а не `component`.

## CMS Page Entry

Шаблон `page-entry` намеренно содержит CMS-specific импорты из реального проекта:

- `infra/cms/component-renderer`;
- `@biocadless/digital-platform-api`;
- `infra/cms/cms-page-entry-registry`.

Перед копированием этого шаблона в другой проект адаптируй импорты, тип props и способ загрузки дерева компонентов под локальную CMS-интеграцию.

## Примеры CLI

```bash
npx @gromlab/create screen cabinet src/compositions/screens
npx @gromlab/create module hero-section src/compositions/screens/home/parts
npx @gromlab/create component header-nav src/compositions/layouts/default-layout/ui
npx @gromlab/create widget clinic-map src/compositions/widgets
npx @gromlab/create business auth src/business
npx @gromlab/create business-with-deps user src/business
npx @gromlab/create store auth src/business/auth/stores
npx @gromlab/create page-entry knv src/compositions/page-entries
npx @gromlab/create business-composition knv-page src/compositions/page-entries/knv
```
