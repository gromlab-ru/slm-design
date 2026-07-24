---
title: Сегменты
description: Сегменты внутри модуля (ui/, parts/, hooks/ и др.), назначение и правила размещения файлов
---

# Сегменты

Раздел описывает сегменты SLM: что такое сегмент, какие бывают и что в каждом из них лежит.

## Определение

**Сегмент — папка внутри модуля, которая группирует файлы по назначению. Набор сегментов не фиксирован — модуль включает только те, которые ему нужны. Команда сама определяет какие сегменты используются в проекте — архитектура даёт рекомендацию.**

## Обзор

| Сегмент | Содержимое |
|---------|------------|
| `ui/` | Презентационные компоненты родительского модуля |
| `parts/` | Вложенные модули со своими сегментами |
| `providers/` | Провайдеры модуля |
| `hooks/` | React-хуки |
| `stores/` | Сторы состояния |
| `services/` | Сценарии и операции владельца module |
| `mappers/` | Трансформация данных между форматами |
| `types/` | TypeScript-типы и интерфейсы |
| `styles/` | Стили |
| `lib/` | Утилиты и хелперы модуля |
| `config/` | Константы и конфигурация |

Сегменты не являются обязательными. Например, `providers/` нужен только модулю, который владеет провайдерами. Если provider, store или guard относится к конкретной странице или маршруту, он размещается внутри соответствующего composition module, а не в `infra` или `shared`.

Business-модули не используют `ui/` для React-компонентов. Доменный logic API живёт в factory/services/hook wrappers/mappers. React tree, guards, layouts и visual fallbacks размещаются в consumer compositions; concrete domain source hooks/stores — в adapters `compositions/business/{domain}`.

## Сегмент ui/

Презентационные компоненты родительского модуля. `ui/` содержит только компоненты, которые отвечают за отображение части интерфейса и не выходят за границы своего модуля.

Компонент в `ui/`:

- Находится в собственной папке.
- Может содержать только `{name}.tsx`, `index.ts`, `styles/`, `types/`.
- Не содержит вложенные компоненты и модули — папка компонента остаётся плоской.
- Может рендерить соседние компоненты из `ui/` своего модуля и компоненты слоя `ui`, если правила слоёв разрешают родительскому модулю импортировать `ui`.
- Не импортирует другой код проекта за пределами родительского модуля.
- Не делает внешние запросы.
- Не вызывает сценарные хуки.
- Не получает данные самостоятельно, не выбирает источник данных и не композирует данные.
- Не содержит бизнес-логику или сценарную логику.

Если UI-сущности нужно что-то за пределами этих ограничений, она должна быть оформлена как модуль. Полная граница описана в разделе [Компонент](./modules.md#компонент).

Корневой файл модуля в `ui/` не размещается. Он лежит в корне модуля: `{module-name}.tsx`.

```text
user/
├── ui/
│   ├── user-avatar/
│   │   ├── user-avatar.tsx
│   │   ├── styles/
│   │   │   └── user-avatar.module.css
│   │   ├── types/
│   │   │   └── user-avatar-props.type.ts
│   │   └── index.ts
│   └── user-status/
│       ├── user-status.tsx
│       └── index.ts
├── types/
├── hooks/
├── user.tsx
└── index.ts
```

Если UI-сущности нужна внутренняя декомпозиция, сценарная логика, получение данных или собственные архитектурные зависимости — это уже не компонент в `ui/`, а модуль в `parts/`.

## Сегмент parts/

Вложенные модули со своими сегментами. `parts/` содержит только модули: каждый элемент `parts/` — папка полноценного модуля с собственным публичным API. Отдельные `.tsx`, стили, хуки или произвольные файлы в `parts/` не размещаются.

```text
compositions/pages/home/
├── parts/
│   ├── hero-section/
│   │   ├── hero-section.tsx
│   │   ├── styles/
│   │   ├── parts/
│   │   │   └── top-banner/
│   │   │       ├── top-banner.tsx
│   │   │       └── index.ts
│   │   └── index.ts
│   └── features-section/
│       ├── features-section.tsx
│       ├── hooks/
│       └── index.ts
├── home.page.tsx
└── index.ts
```

Отличие от `ui/`: элемент `parts/` — модульная папка со своими сегментами. Элемент `ui/` — компонент родительского модуля без собственной архитектурной ответственности.

Вложенность `parts/` инкапсулирует область разработки горизонтально: каждый разработчик работает в своём `parts/`-модуле, не затрагивая чужие. Это снижает конфликты при параллельной разработке.

Если вложенный модуль обрастает своими `parts/` — это сигнал, что он достаточно самостоятельный для подъёма на уровень выше.

## Сегмент providers/

Провайдеры модуля: React Context providers, провайдеры scope-состояния, провайдеры композиции фабрик или другие обёртки, которые принадлежат модулю.

```text
providers/
├── profile-page.provider.tsx
└── profile-business-composition.provider.tsx
```

Provider размещается в том модуле, который владеет соответствующим состоянием или композицией. Page-level provider живёт в page composition module; application-level provider, завязанный на фреймворк, подключается в `app`, но реализуется в нижнем подходящем слое.

## Сегмент hooks/

React-хуки модуля. Инкапсулируют логику, состояние, подписки, побочные эффекты.

```text
hooks/
├── use-auth.hook.ts
├── use-session.hook.ts
└── use-permissions.hook.ts
```

В business-модуле `hooks/` содержит только wrappers, созданные поверх dependency hooks, переданных фабрике. Business не импортирует React state/effect APIs, SWR, TanStack Query, Apollo или другой hook runtime напрямую.

Concrete source hook реализуется adapter-ом в `compositions/business/{domain}` и возвращает business-owned result type. Business wrapper нормализует данные и заменяет source error собственной domain error.

## Сегмент stores/

Сторы состояния composition/infra/UI module. Конкретная реализация зависит от выбранного state manager (Zustand, MobX, Redux и т.д.).

```text
stores/
├── auth.store.ts
└── session.store.ts
```

Если состояние нужно всей странице, concrete store живёт в page composition module. Если состояние относится к бизнес-домену, business владеет state model, transitions и state port. Concrete Zustand/Redux/MobX adapter factory реализуется в `compositions/business/{domain}`, передаётся через `deps`, принимает initial domain state от business-фабрики и возвращает concrete port.

Для каждого store определи creator, scope, количество instances и cleanup. Module singleton допустим только для явно доказанного application/process lifetime.

## Сегмент services/

Сценарии и операции module. Содержимое зависит от слоя и владельца.

```text
services/
├── auth.service.ts
└── token.service.ts
```

Правила по слоям:

- `business/services` реализует доменные сценарии только поверх `deps` фабрики;
- `compositions/business/{domain}/adapters` реализует concrete product/runtime dependencies, а не `services/` обычной composition;
- composition `services/` может оркестрировать готовые business API и технические infra-сервисы, но не обращаться к product source напрямую;
- `infra/services` реализует технический сервис или transport;
- `ui` и `shared` не выполняют product I/O.

Business service не импортирует SDK, generated API, HTTP-клиент, storage, env, browser API, React/SWR/query runtime или concrete store напрямую.

## Сегмент mappers/

Функции трансформации данных на границе ответственности module.

```text
mappers/
├── map-user.ts
├── map-product.ts
└── map-order-to-dto.ts
```

В business-модулях mappers защищают public contract от ненадёжной runtime-границы: преобразуют `unknown` в доменную модель, отклоняют невалидные структуры и не импортируют concrete DTO SDK.

Dependency adapter может преобразовать доменные аргументы в transport payload, но не создаёт доменную модель из ответа, domain error или business fallback. Domain-to-ViewModel mapping принадлежит потребительской composition, если описывает только представление.

## Сегмент types/

TypeScript-типы и интерфейсы модуля. Доменные типы, DTO, пропсы компонентов.

```text
types/
├── user.type.ts
└── session.type.ts
```

В business-модулях `types/` содержит собственные доменные типы, `{Domain}Api`, `{Domain}Deps`, `{Domain}Factory`, dependency hook/state result types и доменные error codes. Generated DTO, SDK-типы, `StoreApi`, query-library types и типы HTTP-клиента не входят в контракт business-модуля.

## Сегмент styles/

Стили модуля. Формат зависит от выбранного подхода (CSS Modules, SCSS, CSS-in-JS и т.д.).

```text
styles/
├── auth.module.css
└── login-form.module.css
```

## Сегмент lib/

Утилиты и хелперы, специфичные для модуля. Чистые функции без побочных эффектов.

```text
lib/
├── validate-email.ts
└── format-phone.ts
```

Отличие от `shared/lib/`: здесь лежат утилиты, нужные только этому модулю. Общие утилиты — в `shared/lib/`.

## Сегмент config/

Константы и конфигурация модуля: маршруты, лимиты, дефолтные значения.

```text
config/
├── routes.ts
└── constants.ts
```
