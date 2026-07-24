---
title: Слой App
status: draft
normative: true
---

# Слой App

`app` является boundary между framework routing/runtime и SLM-модулями приложения.

## Ответственность

`app` может содержать:

- route files;
- framework layout/error/loading/not-found entries;
- framework metadata и route parameters;
- bootstrap imports;
- подключение global styles/assets;
- framework-required middleware и handlers.

## Правила

**SLM-APP-001 - ОБЯЗАН.** Route entry должен оставаться тонким adapter, нормализующим framework input и делегирующим готовому composition module.

```text
framework route
  → composition entry
```

**SLM-APP-002 - ЗАПРЕЩЕНО.** `app` не может владеть product page, screen, widget, domain scenario, store, domain Provider или cross-domain graph.

**SLM-APP-003 - ЗАПРЕЩЕНО.** Route entry не должен напрямую собирать domain adapters, вызывать SDK или формировать product model.

**SLM-APP-004 - ОБЯЗАН.** Framework-specific input должен быть считан в `app` и передан вниз в минимальной нормализованной форме.

Механическая нормализация включает извлечение route params, headers и framework wrappers. Product validation, создание value objects и выбор domain outcome остаются в domain business.

**SLM-APP-005 - ЗАПРЕЩЕНО.** Другие SLM-слои не могут импортировать `app`.

**SLM-APP-006 - СЛЕДУЕТ.** Framework behavior, которому нужен product graph или product UI, следует реализовать готовым composition entry и только подключить из `app`.

**SLM-APP-007 - МОЖЕТ.** `app` может напрямую импортировать framework APIs и static/global resources из `shared`, если framework требует подключить их в root entry.

## Допустимая структура

Структуру `app` определяет framework. SLM не требует превращать framework directories в SLM modules и не требует `index.ts` для route folders.

```text
app/
├── layout.tsx
├── error.tsx
├── not-found.tsx
├── api/
└── products/
    └── [product]/
        └── page.tsx
```

## Недопустимые владельцы

Следующие сущности не должны определяться в `app`:

- `ProductPage`;
- `AuthProvider`;
- `createOrdersRuntime`;
- page-local store;
- domain mapper;
- reusable product component;
- concrete product adapter.
