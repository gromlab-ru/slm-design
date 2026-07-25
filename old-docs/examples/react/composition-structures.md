---
title: Структуры compositions
description: Примеры организации слоя compositions под разные способы сборки React-приложения
---

# Структуры compositions

Раздел показывает, что SLM не фиксирует жёсткую структуру внутри `compositions`. Команда выбирает организацию под фреймворк, роутинг, CMS и продуктовую задачу.

## Базовая рекомендация

Подходит для большинства приложений, где есть явные страницы, layouts, screens и переиспользуемые композиционные блоки.

```text
src/compositions/
├── business/
│   ├── auth/
│   └── user/
├── pages/
│   ├── home/
│   └── profile/
├── layouts/
│   ├── main/
│   └── dashboard/
├── screens/
│   ├── home/
│   └── profile/
└── widgets/
    ├── page-heading/
    └── promo-banner/
```

`business`, `pages`, `layouts`, `screens` и `widgets` здесь не являются отдельными SLM-слоями. Это группы composition modules внутри одного слоя `compositions`.

`compositions/business/{domain}` используется для runtime-сборки business-фабрик. Он не заменяет `business/{domain}` и не содержит доменную логику.

Только эта группа integration modules знает одновременно business dependency contract и concrete product runtime. Остальные composition modules являются graph owners или consumers готовых business API.

## Entry-points и blocks

Подходит для проектов, где точка сборки не всегда является страницей: CMS registry, embedded UI, route entries, feature entries.

```text
src/compositions/
├── entry-points/
│   ├── cms-profile/
│   └── embedded-checkout/
├── pages/
│   └── profile/
├── layouts/
│   └── profile-main/
├── screens/
│   └── profile/
└── blocks/
    ├── profile-summary/
    └── recommended-products/
```

## Группировка вокруг продукта

Подходит, когда удобнее держать все части одной крупной области рядом.

```text
src/compositions/
└── profile/
    ├── page/
    ├── layout/
    ├── screen/
    └── blocks/
```

## Главное правило

Любая структура допустима, если соблюдаются границы слоя:

- `app` подключает готовые composition modules к фреймворку.
- `compositions` может импортировать `business`, `infra`, `ui`, `shared`.
- `compositions/business/{domain}` отдельными adapters собирает конкретную business-фабрику с runtime-зависимостями.
- Page/layout/screen/widget получают product data только через `{Domain}Api`.
- Graph owner импортирует builders, но не raw product SDK/client/event для досборки домена.
- `business`, `infra`, `ui`, `shared` не импортируют `compositions`.
- Импорты между composition modules идут только через public API.
- Deep imports внутрь composition modules запрещены.
