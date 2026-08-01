# Demo frontend

Полноценное Next.js 16 приложение поверх меньшего из двух fixture API: `../demo-backend/openapi/simple.json`.

Пример показывает SLM Level 1 на каталоге: public data, JWT login/refresh/logout, persisted cart, checkout, protected orders, RBAC, admin CRUD, optimistic locking и детерминированные network outcomes.

## Запуск

Требуются Node.js 20+, npm 10+ и современный browser с Web Locks API. Auth и cart transitions работают fail-closed без cross-tab lock; `localhost` считается secure context для локальной разработки.

Сначала запустите Simple API:

```bash
cd ../demo-backend
npm install
npm run dev:simple
```

Затем запустите frontend:

```bash
npm install
npm run dev
```

Откройте `http://localhost:3000`. Backend по умолчанию доступен на `http://localhost:3001`.

Чтобы изменить URL backend, создайте `.env.local` рядом с `package.json`:

```bash
NEXT_PUBLIC_SIMPLE_API_URL=http://localhost:3001
```

## Demo accounts

| Email | Password | Role | Scenarios |
|---|---|---|---|
| `admin@demo.local` | `demo1234` | admin | Product CRUD, all orders |
| `customer@demo.local` | `demo1234` | customer | Cart, checkout, own orders |

## Routes

| Route | Composition responsibility |
|---|---|
| `/` | Product search, category filter, sorting and pagination |
| `/products/[productId]` | Product detail and add-to-cart |
| `/cart` | Multi-domain checkout coordination |
| `/orders` | Protected order history and cancellation |
| `/sign-in` | JWT session lifecycle and account selection |
| `/admin/products` | RBAC-gated CRUD and optimistic locking |

Плавающий `Demo controls` widget переключает `X-Demo-Scenario`: slow, timeout, 500, 429, empty, expired auth, forbidden и conflict. Отдельное действие `Seed 250` загружает настоящий большой seed с интерактивными product IDs; synthetic `large-dataset` header намеренно не используется для mutation UI.

## SLM boundary

`src` является SLM root:

```text
src/
├── app/             Next.js bootstrap and route entries
├── compositions/    Layout, screens and demo widget
├── domains/         Auth, catalog, cart, orders and demo-control
├── infra/           Generated REST client, JWT storage and browser storage
├── ui/              Product-agnostic button, form field and feedback panel
└── shared/          Deterministic predicates, formatting and Result type
```

Пример использует Level 1 осознанно: у каждого домена одна browser runtime integration. Дополнительные factories, adapters и assemblies Level 2 не окупили бы стоимость. Checkout остаётся в composition, поэтому `orders` не импортирует `cart`, а module graph остаётся ацикличным.

State и lifecycle распределены по владельцам:

- `auth` владеет пользовательской сессией; `infra/simple-auth-session` хранит technical JWT pair, стабильный `sessionId` и CAS revision.
- `cart` владеет строками, totals и persisted snapshot validation; monotonic revision и conditional clear сериализованы между вкладками.
- SWR cache принадлежит REST infra module, создаётся отдельным provider и remount-ится при смене logical auth session.
- React providers создаются один раз в application scope и очищают свои subscriptions при unmount.
- Route entries только адаптируют Next.js params и подключают public APIs compositions.
- Reset, seed, role и request-scenario transitions синхронизируют cache, auth, cart и route-local pagination между вкладками.

## REST client

Split SDK генерируется из committed OpenAPI:

```bash
npm run codegen:simple-rest-api
```

Generated-код живёт только в `src/infra/simple-rest-api/generated` и не редактируется вручную. GET hooks вызывают точечные operations через `simpleHttpClient`; submit-сценарии используют полный `simpleRestApi`. Внешний код импортирует REST capability только через `@/infra/simple-rest-api`.

OpenAPI fixture описывает числовые `page` и `limit` как `object`. Исправление generated type изолировано в `types/to-generated-query.ts`; runtime query остаётся числовым.

JWT refresh выполняется в transport `onError`, ограничен одним retry и дедуплицирует конкурентные refresh requests одной revision. CAS не позволяет позднему refresh воскресить logout или перезаписать новый login. Хранение refresh token в `localStorage` допустимо только для этой архитектурной fixture; production-приложение должно выбрать threat model и более безопасную session strategy.

Checkout привязан к captured auth session и persisted cart revision. Backend атомарно проверяет product version, unit price, USD currency, aggregate stock и уникальность product lines. Timeout-сценарий откладывает mutation handler и отменяет его при disconnect, поэтому frontend timeout не скрывает завершившийся POST.

## Проверка

```bash
npm run check
npm run build
```

`npm run check` запускает architecture constraints, ESLint, TypeScript и Vitest. Architecture script строит import graph через TypeScript AST и явный module manifest, затем проверяет направление слоёв, public module imports, side-effect/dynamic imports, запрет утечки generated SDK и циклы.
