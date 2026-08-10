# SLM Store

Облегчённое React + Vite приложение по Scoped Layered Module Design. Оно использует только маленький контракт [`../demo-backend/openapi/simple.json`](../demo-backend/openapi/simple.json); `complex.json` намеренно не включён в runtime-граф.

## Возможности

- JWT login, однократный конкурентный refresh и idempotent logout.
- Вход под admin и customer demo-учётными записями.
- Каталог с поиском, категориями, сортировкой и offset pagination.
- Admin create, update с optimistic locking и delete продукта.
- Draft order с фиксацией версии и цены продукта.
- Checkout, stock/currency validation, история и отмена заказов.
- Собственные доменные модели, исходы и runtime-проверка внешних ответов.

## Запуск

Требуются Node.js 20+ и npm 10+.

Сначала запустите Simple backend:

```bash
cd examples/demo-backend
npm install
npm run dev:simple
```

Затем в отдельном терминале запустите frontend:

```bash
cd examples/react-vite
npm install
npm run dev
```

Frontend откроется на `http://localhost:5173`, backend работает на `http://localhost:3001`.

## Demo-пользователи

| Роль | Email | Пароль |
|---|---|---|
| Administrator | `admin@demo.local` | `demo1234` |
| Customer | `customer@demo.local` | `demo1234` |

## Конфигурация

```bash
cp .env.example .env
```

| Переменная | Назначение | Значение по умолчанию |
|---|---|---|
| `VITE_SIMPLE_API_URL` | Base URL Simple API | `http://localhost:3001` |

Access token живёт в памяти вкладки. Refresh token хранится в `sessionStorage` и очищается вместе с session-scoped SWR cache при logout или окончательном истечении сессии.

## OpenAPI

Generated-код находится в `src/infra/simple-rest-api/generated` и не редактируется вручную. Регенерация использует зафиксированную версию `@gromlab/api-codegen`:

```bash
npm run codegen:simple-rest-api
```

OpenAPI ошибочно описывает `page` и `limit` через пустую `Object` schema. Исправленный browser-контракт локализован внутри `infra/simple-rest-api/types`; generated-файлы остаются неизменными.

## SLM

SLM root: `src`.

| Слой | Владельцы и ответственность |
|---|---|
| `app` | Vite entry, router, application providers и cache lifecycle |
| `compositions` | `sign-in`, `storefront`, `app-shell`; только размещение и связывание публичных API |
| `domains` | `session`, `catalog`, `orders`; модели, сценарии, исходы, состояние, UI и source adaptation |
| `infra` | `simple-rest-api`; generated SDK, transport credentials, refresh race и SWR GET-хуки |
| `ui` | Универсальные `button` и `field` |
| `shared` | Чистые formatters и value predicates |

Свёрнутый граф модулей:

```text
app -> compositions
app -> domains
compositions -> compositions
compositions -> domains
domains -> infra
domains -> ui
domains -> shared
```

Каждый внешний импорт проходит через корневой `index.ts` целевого модуля. В корне модуля находятся только публичные фасеты и не более одного главного implementation/assembly-файла; context, hooks, source, types и прочая реализация находятся в сегментах.

### Владение состоянием

| Состояние | Владелец | Область жизни |
|---|---|---|
| Пользователь и session status | `domains/session` | Всё browser-приложение |
| JWT credentials и refresh promise | `infra/simple-rest-api` | Вкладка / transport singleton |
| Product/order server state | REST hooks + доменная адаптация | Application SWR cache |
| Draft order | `domains/orders` | Авторизованный storefront route |
| Фильтры и editor state | `domains/catalog` | Экземпляр CatalogPanel |

## Проверки

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run check
```

Тесты покрывают полный login-to-checkout smoke, объединение конкурентных 401 в один refresh и независимое преобразование source errors в доменные исходы.
