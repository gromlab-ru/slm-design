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

**SLM-BASE-APP-001 - ОБЯЗАН.** Route entry должен оставаться тонким adapter, нормализующим framework input и делегирующим готовому composition module.

```text
framework route
  → composition entry
```

**SLM-BASE-APP-002 - ЗАПРЕЩЕНО.** `app` не может владеть product page, screen, widget, product scenario, store или application wiring.

**SLM-BASE-APP-003 - ЗАПРЕЩЕНО.** Route entry не должен напрямую собирать product integrations, вызывать SDK или формировать product model.

**SLM-BASE-APP-004 - ОБЯЗАН.** Framework-specific input должен быть считан в `app` и передан вниз в минимальной нормализованной форме.

Механическая нормализация включает извлечение route params, headers и framework wrappers. Product validation, создание value objects и выбор product outcome остаются у владельца product semantics.

Запрет другим SLM-слоям импортировать `app` определяется base-правилом `SLM-BASE-ARCH-003`.

**SLM-BASE-APP-006 - СЛЕДУЕТ.** Framework behavior, которому нужны product dependencies или product UI, следует реализовать готовым composition entry и только подключить из `app`.

**SLM-BASE-APP-007 - МОЖЕТ.** `app` может напрямую импортировать framework APIs и static/global resources из `shared`, если framework требует подключить их в root entry.

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

## Примеры нарушений

Следующие сущности являются примерами нарушений `SLM-BASE-APP-002` и `SLM-BASE-APP-003`:

- `ProductPage`;
- product Provider;
- application service creator;
- page-local store;
- product mapper;
- reusable product component;
- concrete product integration.
