# Framework bindings внутри Domain

> Рабочая заметка. Не является нормативным разделом спецификации.

## Определение

### FW-N001: Framework code определяется зависимостью от framework

К framework code относится код, существующий из-за React, Vue, Next.js или другого framework/runtime contract:

- components;
- providers и contexts;
- framework hooks;
- framework lifecycle;
- directives и framework entrypoints;
- framework-specific types;
- server/client component boundaries.

Такой код может принадлежать Domain по смыслу, но не размещается внутри framework-neutral business.

## Роль binding

### FW-N002: Framework binding адаптирует готовый business API

Framework binding может:

- предоставить готовый business API через context/provider;
- построить React/Vue hook доступа;
- связать framework lifecycle с domain subscription;
- предоставить domain-specific framework component;
- получить API instance через props, context или preset.

Framework binding не изменяет business rules и не реализует source adapter вместо Domain preset/adapters.

## Возможная структура

```text
domains/auth/{framework-binding}/
├── providers/
├── hooks/
├── components/
├── types/
└── index.ts
```

`{framework-binding}` является placeholder. SLM пока не выбирает между `react`, `bindings/react`, `framework/react` и другим локальным соглашением. Чёткая граница определяется самостоятельным module и отдельным public entrypoint, а не обязательным именем родительской папки.

Если одна папка предоставляет cohesive framework API, она является module. Если папка только классифицирует несколько самостоятельных binding modules, она является logical group и не имеет собственного `index.ts`.

## Reactive state

### FW-N003: Framework hook строится снаружи business

Если business предоставляет framework-neutral `getSnapshot` и `subscribe`, React binding может использовать `useSyncExternalStore`:

```ts
'use client'

export const createUseAuth = (authApi: AuthApi) => {
  return () => {
    return useSyncExternalStore(
      authApi.subscribeAuthState,
      authApi.getAuthState,
      authApi.getAuthState,
    )
  }
}
```

Это только иллюстрация направления. Финальная форма state port должна учитывать реальный state/query runtime.

Business при таком подходе не импортирует React и не возвращает React hook как единственный способ чтения состояния.

## Framework module как assembly site

### FW-N004: Provider может владеть API instance

Provider вправе вызвать preset или factory, если provider является явным владельцем scope и lifecycle:

```text
AuthProvider
  → createBrowserAuth preset
  → AuthApi instance
  → context
  → access hooks
```

Provider construction не должен запускать I/O или subscription до framework commit/effect. Cleanup выполняется владельцем lifecycle.

Framework module не обязан собирать API. Он также может получить готовый instance от route/page/application graph owner.

## Framework-neutral и environment-neutral

Эти свойства различаются:

| Свойство | Запрещённая зависимость |
|---|---|
| Framework-neutral | React, Vue, Next lifecycle и types |
| Environment-neutral | Browser-only, Node-only, server-only, env/runtime globals |

Business factory должна удовлетворять обоим свойствам. Framework binding по определению framework-specific, а preset по определению может быть environment-specific.

## Domain UI

### FW-N005: Framework принадлежность не доказывает Domain ownership

React component размещается внутри Domain только если его ответственность принадлежит Domain. Page, screen, route outcome, локальный текст ошибки и продуктовая композиция могут остаться в `compositions`.

Граница между domain-specific components и consumer compositions пока требует отдельных примеров.
