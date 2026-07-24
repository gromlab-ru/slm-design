---
title: Архитектурная проверка
description: Блокирующие проверки SLM перед завершением создания, рефакторинга и архитектурного ревью
---

# Архитектурная проверка

Не считай задачу завершённой только потому, что код компилируется или UI отображается. Проверь архитектурное решение, runtime-цепочку и обязательные тестовые границы.

## Проверка владельца

- У каждой ответственности один явный владелец.
- Product state и сценарии принадлежат business-домену.
- Page/route UI-state принадлежит соответствующему composition module.
- Concrete technical service принадлежит infra-модулю.
- Concrete business dependency adapter принадлежит `compositions/business/{domain}`.
- Provider находится у владельца scope, а не в generic infra-модуле.
- Код не поднят в общий слой или package без реального consumer.

## Проверка runtime-цепочки

Для каждого `{Domain}Api` проследи цепочку сборки:

```text
graph owner
  → per-domain builder
  → dependency adapters + business factory
  → {Domain}Api
  → provider/entry
```

И отдельно цепочку вызова:

```text
consumer
  → {Domain}Api
  → business scenario
  → {Domain}Deps
  → dependency adapter
  → source/runtime
```

Если отсутствует хотя бы одно необходимое звено, домен не подключён. Тип будущего API, пустой provider или неиспользуемый builder не заменяет runtime-сборку.

Для каждого route/page entry проверь, что он достигает готового composition module. `app` не должен реализовывать screen/layout/product wiring самостоятельно.

## Проверка business imports

В production-коде `business/**` не должно быть прямых runtime или type-only imports из concrete runtimes:

- `infra`, `compositions`, `app`;
- SDK/generated clients;
- SWR/TanStack Query/Apollo;
- Zustand/Redux/MobX/RxJS store runtime;
- React state/effect runtime;
- storage/browser API;
- env/event bus/clock/random implementations.

Разрешены собственные файлы, type-only business contracts, `shared` без runtime-capabilities и чистые детерминированные библиотеки.

Проверь не только import paths, но и re-export/barrel/helper, который может скрывать запрещённую зависимость.

## Проверка deps

- Каждая runtime-capability присутствует в `{Domain}Deps`.
- Контракт принадлежит business и назван доменным языком.
- В `Deps` нет client/SDK/generated operation/StoreApi/query-library types.
- Dependency hook возвращает business-owned source result.
- State dependency использует business-owned state port.
- External result имеет `unknown`, если требует runtime validation.
- Subscription возвращает cleanup.
- Cross-domain API сужен до реально используемых методов.

## Проверка adapters

- Для каждой runtime-capability есть явный adapter.
- Adapter находится в `compositions/business/{domain}`.
- Builder не содержит inline integration logic.
- Adapter не формирует domain error.
- Adapter не выполняет domain normalization.
- Adapter не выбирает business fallback.
- Private adapters отсутствуют в public `index.ts`.
- Concrete transport imports не протекают в обычные consumer compositions.

## Проверка product data

- Page/layout/screen/widget получает product data через `{Domain}Api`.
- Нет прямого вызова SDK/client/generated operation из потребительской composition.
- Нет product storage access в UI/component/composition service.
- DTO не используется как domain/view contract без business normalization.
- Один источник не имеет параллельного прямого и business-пути.

## Проверка ошибок

Для каждого public runtime operation проверь:

- rejected dependency;
- synchronous throw dependency;
- `undefined`/`null`/empty body;
- объект неправильной формы;
- source hook error;
- invalid state/storage value;
- неизвестную runtime-ошибку.

Во всех случаях наружу выходит только domain error со стабильным `code`. Source error сохраняется в `cause`, но не становится consumer contract. Technical failure и malformed response нельзя превращать в fallback; fallback разрешён только для валидного доменного исхода.

Не оставляй формулировку «domain error, если контракт это обещает». Business public contract всегда обещает только domain errors.

## Проверка state и hooks

- Business владеет domain state model, но не concrete state manager.
- Zustand/Redux/MobX store создаётся adapter-ом, не factory.
- SWR/Query hook создаётся adapter-ом, не business-модулем.
- Dependency hook является non-throwing/non-Suspense и передаёт technical error через business-owned result.
- Business wrapper вызывает dependency hook и возвращает собственный result type.
- Business wrapper преобразует error result и ошибки callbacks в domain errors.
- Store/query library types отсутствуют в public API и `Deps`.
- Определены creator, scope, количество instances и cleanup.
- Module singleton используется только при явно доказанном application/process lifetime.
- Provider не создаёт ложное впечатление владения instance, созданным на module scope.

## Проверка graph

- Per-domain builders собирают только свои фабрики.
- Graph owner назван и соответствует lifecycle.
- Домены создаются в топологическом порядке.
- Runtime-циклы отсутствуют.
- Один и тот же graph не копируется по нескольким providers без обоснования scope.
- Screen/widget не собирает graph самостоятельно.
- Provider value имеет точный тип.
- Нет `Partial<Graph>` с unchecked cast к полному graph.
- Subscription, timer, socket и другие resources имеют cleanup/dispose.
- Pending operation не может записать stale state после invalidation/unmount без явно принятой политики.

## Проверка public API

- Межмодульные импорты идут через реальный public entrypoint.
- Import alias/package export существует физически.
- Group не имеет `index.ts`.
- Business `index.ts` экспортирует runtime только factory, остальное через `export type`.
- Integration module экспортирует builder и необходимые type-only integration input contracts.
- Raw context, raw store, mutable singleton, adapter, generated operation и persistence key закрыты.
- Каждый export имеет реального внешнего consumer.
- Deep imports отсутствуют, включая tests уровня public contract.

## Проверка тестов

Business-модуль не завершён без factory-level tests.

Обязательный минимум:

1. Форма public API фабрики.
2. Happy path каждого runtime method/hook.
3. Invalid dependency response.
4. Rejected dependency.
5. Synchronous throw каждого обычного method/callback/state/lifecycle dependency. Dependency hooks проверяются отдельным non-throwing contract.
6. Domain error `code` и `cause`.
7. Порядок side effects и остановка после ошибки.
8. State transitions и concurrent calls.

`compositions/business/{domain}` не завершён без assembly tests:

1. Factory получает правильные adapters.
2. Каждый adapter вызывает нужный runtime source с правильным payload.
3. Builder не делает I/O при создании API.
4. Cross-domain API передан в правильном виде.
5. Private adapters не раскрыты public API.
6. Adapter пробрасывает source error без создания domain error.
7. Dependency hook не бросает и не использует Suspense/throw-on-error mode.
8. Lifecycle cleanup проверен, если есть subscriptions/resources.

Colocated tests обязательны для mappers, normalizers, type guards, domain errors и другой внутренней runtime-safe логики. Они дополняют, но не заменяют factory-level tests. Подробная матрица находится в [Тестировании business-модулей](../examples/business-testing.md).

Проверь наличие исполняемого test script и test runner именно в изменяемом workspace. Root task без локального script не является выполненной тестовой инфраструктурой.

## Проверка целостности репозитория

- Все imports разрешаются.
- Все упомянутые modules и public entrypoints существуют.
- Direct runtime packages объявлены в package текущего workspace.
- Старый provider/store/source path удалён после миграции, если больше не используется.
- Нет speculative scaffold с пустым graph, несуществующими доменами или placeholder contracts.
- Template исправлен, если именно он системно создаёт нарушение.
- Выполнены доступные typecheck, tests, lint/build и `git diff --check`.

## Формат архитектурного ревью

Для каждого нарушения укажи:

1. Путь и строку.
2. Нарушенный invariant.
3. Runtime или maintenance риск.
4. Минимальную корректную границу.
5. Необходимые tests.

Отделяй обязательное нарушение от необязательного улучшения. Не предлагай большую миграцию, если нарушение можно устранить локально без создания второй архитектуры.

## Финальный gate

Перед завершением ответь «да» на все вопросы:

- Архитектурная роль изменения определена?
- Владелец ответственности и state определён?
- Все runtime-capabilities проходят через правильную границу?
- Product data проходит через business API?
- Business вызывает только переданные deps и собственную детерминированную логику?
- Наружу выходят только domain errors?
- Adapters существуют и закрыты?
- Graph и lifecycle определены?
- Public API минимален и разрешим?
- Обязательные tests созданы и запущены?
- Изменение не оставило старый параллельный путь?

Если хотя бы один ответ «нет», задача не завершена.
