# Шаблоны монорепозитория

Шаблоны создают повторяемый boilerplate после принятого SLM-решения. Шаблон не выбирает owner, layer, scope, public API или product data path.

Запускай генератор из корня монорепозитория, где находится `.templates`:

```bash
npx @gromlab/create <template> <name> [path]
```

`[path]` — папка вывода относительно корня монорепозитория, например `apps/admin/src/compositions/screens`.

## Как выбирать шаблон

Сначала примени `slm-design`. Затем выбирай специализированный шаблон: `route`, `layout`, `screen`, `widget`, `business`, `business-composition` или `rest-api`.

Если сущность не попадает под один из специализированных шаблонов, используй `module`.

`module` — основной универсальный шаблон для обычных SLM-модулей и компонентов внутри существующих модулей.

## Доступные шаблоны

| Шаблон | Для чего | Куда генерировать |
|---|---|---|
| `route` | Leaf route module Next.js с обязательным business provider, одноимённым screen и public API. | `apps/web/src/compositions/routes` |
| `layout` | Layout composition с `*.layout.tsx`, стилями, props и public API. | `apps/{app}/src/compositions/layouts` |
| `screen` | Screen composition с `*.screen.tsx`, стилями, props и public API. | `apps/{app}/src/compositions/screens` |
| `widget` | Переиспользуемый composition widget, не привязанный к одной странице. | `apps/{app}/src/compositions/widgets` |
| `business` | Business-домен слоя `src/business`: factory, deps, domain error и public API. | `apps/{app}/src/business` |
| `business-composition` | Runtime-сборка business-домена: `create*Business` и public API. | `apps/{app}/src/compositions/business` |
| `rest-api` | Vite runtime REST-модуль поверх generated SDK: transport, errors и полный bound-клиент. Только для `apps/admin`. | `apps/admin/src/infra` |
| `module` | Универсальный SLM-модуль или компонент, если сущность не подходит под шаблоны выше. | `apps/{app}/src/**/parts`, `apps/{app}/src/**/ui`, локальные сегменты модулей |

## Route

`route` создаёт leaf route module Next.js в `apps/web/src/compositions/routes`.

Передавай имя без суффикса `-route`: генератор создаст папку `{name}`, файл `{name}.route.tsx`, компонент `{Name}Route` и обязательный `{Name}BusinessProvider`.

Route и одноимённый screen должны представлять одну leaf-страницу: `home` route подключает `HomeScreen`, `product` route подключает `ProductScreen`.

Route module не собирает общий layout. Общий каркас route group остаётся в соответствующем `app/**/layout.tsx` и подключает layout composition напрямую.

Business provider создаётся всегда, даже если route пока не владеет business API. До появления реального graph он передаёт точное пустое значение `value={{}}`.

После генерации добавляй в provider только реально используемые route-level business API и определяй их lifecycle внутри route scope.

Экспортируй route component через public API модуля и подключай его из соответствующего `app/**/page.tsx`.

## Module

`module` — fallback-шаблон проекта.

Используй его для:

- обычных вложенных модулей в `parts`;
- компонентов внутри `ui` родительского модуля;
- UI-модулей слоя `src/ui`;
- небольших composition-модулей, для которых нет отдельного шаблона;
- любой повторяемой сущности, которая не является `route`, `layout`, `screen`, `widget`, `business` или `business-composition`.

Шаблон создаёт корневой `.tsx`, `styles`, `types` и `index.ts`. После генерации убирай лишнее вручную, если конкретному модулю не нужны стили или props.

## Business

`business` создаёт каркас доменного модуля слоя `src/business`.

После генерации:

- не оставляй пустые `Api` и `Deps`: замени их реальными сценариями и минимальными runtime capabilities;
- добавь `services`, `hooks`, `mappers`, `lib` и доменные типы по мере появления логики;
- расширь `ERROR_CODES` конкретными кодами;
- добавь factory-level tests до завершения задачи.

## Business Composition

`business-composition` создаёт runtime-сборку business-домена для application scope.

После генерации:

- замени пустой вызов `factory({})` на явные private adapters и config;
- добавь отдельный `adapters/*` для каждой runtime capability из `Deps`;
- добавь `types/create-*-business-deps.type.ts`, если сборка зависит от другого business API;
- не экспортируй adapters через `index.ts`;
- добавь assembly tests до завершения задачи.

## REST API

`rest-api` создаёт Vite runtime infra-модуль для generated SDK `{name}-rest-api-sdk`. Шаблон не выбирает auth strategy и не предназначен для Next.js.

Передавай имя сервиса без суффикса `-rest-api`: `adp-client` создаст `src/infra/adp-client-rest-api`.

После генерации:

- настрой фактическую переменную окружения для base URL;
- добавь auth, cookies, CSRF и lifecycle только по фактическому контракту сервиса;
- экспортируй только transport API и точечные types, имеющие реальных consumers;
- подключай product operations через private adapters в `compositions/business/{domain}`;
- не используй GET-хуки напрямую из page, route, screen, widget или UI.

## Примеры

```bash
npx @gromlab/create route home apps/web/src/compositions/routes
npx @gromlab/create layout main apps/admin/src/compositions/layouts
npx @gromlab/create screen main apps/admin/src/compositions/screens
npx @gromlab/create widget error-state apps/admin/src/compositions/widgets
npx @gromlab/create business user apps/admin/src/business
npx @gromlab/create business-composition user apps/admin/src/compositions/business
npx @gromlab/create rest-api backend apps/admin/src/infra
npx @gromlab/create module hero-section apps/admin/src/compositions/screens/main/parts
npx @gromlab/create module submit-button apps/admin/src/compositions/screens/main/ui
```
