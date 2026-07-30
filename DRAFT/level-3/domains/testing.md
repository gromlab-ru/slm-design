# Тестирование Domain

> Рабочая заметка. Не является нормативным разделом спецификации.

## Главный принцип

### TST-N001: Тест размещается у владельца проверяемой ответственности

Domain не получает одну общую папку `tests/` для всего кода. Business behavior, adapter wiring, preset lifecycle, framework bindings и UI имеют разных владельцев и тестируются рядом с ними.

```text
business behavior → business tests
pure domain rule → colocated business test
adapter behavior → adapter test
preset assembly → preset test
framework lifecycle → framework binding test
UI interaction → UI owner test
cross-domain graph → graph owner test
```

## Матрица покрытия

| Граница | Предварительная обязательность | Что проверяется |
|---|---|---|
| Business factory | Главная, обязательная | Scenarios, state, errors, ports, порядок effects |
| Public pure business functions | Обязательная | Validation, normalization, invariants и edge cases |
| Internal runtime-safe logic | По сложности | Mappers, guards, parsers, races и branching |
| Domain error implementation | Обязательная при runtime errors | Codes, guard, observable fields и source isolation |
| Adapters | Обязательная при наличии | Port contract, payload, raw result/error и cleanup |
| Production presets | Обязательная при наличии | Wiring, scope, ownership transfer и construction safety |
| Framework bindings | При наличии поведения | Provider, hooks, reactivity, lifecycle и hydration |
| Domain-owned UI | При наличии значимого поведения | States, interactions и accessibility contract |
| Cross-domain graph | При наличии graph | Assembly order, API handoff, scope и cleanup |
| E2E | По продуктовой потребности | Полный пользовательский поток |

## Предварительная структура

```text
domains/auth/
├── business/
│   ├── auth.factory.ts
│   ├── index.ts
│   ├── index.test.ts
│   ├── errors/
│   │   ├── auth-error.ts
│   │   └── auth-error.test.ts
│   ├── lib/
│   │   ├── auth-phone.ts
│   │   └── auth-phone.test.ts
│   ├── services/
│   ├── types/
│   └── tests/
│       └── factory/
│           ├── public-api.test.ts
│           ├── request-phone-otp.test.ts
│           ├── resend-phone-otp.test.ts
│           ├── verify-phone-otp.test.ts
│           └── testing/
│               └── create-auth-test-harness.ts
├── presets/
│   └── {preset-name}/
│       ├── adapters/
│       │   ├── auth-source.adapter.ts
│       │   └── auth-source.adapter.test.ts
│       ├── create-auth.ts
│       ├── create-auth.test.ts
│       └── index.ts
└── {framework-binding}/
    ├── auth.provider.tsx
    ├── auth.provider.test.tsx
    ├── use-auth.ts
    └── use-auth.test.tsx
```

Это карта возможных тестов, а не обязательный scaffold. Файл создаётся только вместе с реальным поведением, которое требуется проверить.

## Business tests

### TST-N002: Factory-level tests являются главными тестами Domain behavior

Business factory тестируется как black box через public API business-модуля:

```ts
import {
  authFactory,
  AUTH_ERROR_CODES,
  isAuthError,
} from '@/domains/auth/business'
```

Factory-level tests не зависят от React, Next.js, production SDK, real storage или production presets. Все runtime capabilities заменяются test ports, mocks, stubs или in-memory fakes.

Обязательная матрица для public scenarios:

- форма возвращаемого API;
- отсутствие side effects при вызове factory;
- happy path;
- input validation;
- нормализация результатов ports;
- nullable, empty и malformed results;
- rejected promise dependency;
- synchronous throw dependency;
- stable domain error code;
- отсутствие raw source error как consumer contract;
- порядок side effects;
- остановка следующих effects после failure;
- state transitions;
- repeated и concurrent calls, если они влияют на контракт;
- lifecycle operations и cleanup, если они входят в public business API.

Если business behavior невозможно проверить без React, Vue, Next.js или concrete SDK, это сигнал о проникновении framework/runtime ответственности внутрь business.

### TST-N003: Factory-level test использует per-test assembly

Каждый test case создаёт factory с нужной именно ему конфигурацией ports:

```ts
it('maps source failure to domain error', async () => {
  const cause = new Error('Network failed')
  const requestCode = vi.fn().mockRejectedValue(cause)
  const { api } = createAuthTestHarness({ requestCode })

  await expect(api.requestPhoneOtp(phone)).rejects.toMatchObject({
    code: AUTH_ERROR_CODES.PHONE_OTP_REQUEST_FAILED,
  })
})
```

Другой test case создаёт независимую assembly:

```ts
it('does not call source for invalid phone', async () => {
  const requestCode = vi.fn()
  const { api } = createAuthTestHarness({ requestCode })

  await expect(api.requestPhoneOtp('123')).rejects.toMatchObject({
    code: AUTH_ERROR_CODES.PHONE_OTP_PHONE_INVALID,
  })

  expect(requestCode).not.toHaveBeenCalled()
})
```

### TST-N004: Test harness не является preset

Test harness является private test utility, которая уменьшает boilerplate и предоставляет observability:

```ts
const { api, ports, state } = createAuthTestHarness(overrides)
```

Test harness:

- private для конкретной test suite;
- не экспортируется production entrypoint;
- допускает произвольные scenario-specific overrides;
- создаёт новый API instance для каждого test case;
- не представляет устойчивую application environment;
- не имеет собственного production lifecycle;
- не размещается в `presets/`.

Общий `test preset` по умолчанию не создаётся. Если Storybook, demo application или e2e environment получают устойчивую именованную конфигурацию, это отдельный application preset, а не универсальная конфигурация unit tests.

Предварительное имя helper:

```text
business/tests/factory/testing/create-auth-test-harness.ts
```

## Public API tests

### TST-N005: Business public API проверяется отдельно

Runtime public exports фиксируются тестом entrypoint:

```ts
import * as authBusiness from '.'

expect(Object.keys(authBusiness).sort()).toEqual([
  'AUTH_ERROR_CODES',
  'authFactory',
  'isAuthError',
  'normalizeAuthPhone',
  'validateAuthPhone',
])
```

Этот тест обнаруживает случайный runtime export, но не видит type-only exports. Полная проверка type surface должна выполняться будущим architecture lint или TypeScript API check.

Форма API instance также фиксируется factory-level test:

```ts
expect(Object.keys(authFactory(ports)).sort()).toEqual([
  'requestPhoneOtp',
  'resendPhoneOtp',
  'signOut',
  'verifyPhoneOtp',
])
```

## Pure domain functions

### TST-N006: Pure functions тестируются рядом с реализацией

```text
business/lib/auth-phone.ts
business/lib/auth-phone.test.ts
```

Проверяются:

- canonical values;
- boundary values;
- malformed input;
- normalization;
- invariants;
- отсутствие mutation входа;
- детерминированность результата.

```ts
describe('normalizeAuthPhone', () => {
  it.each([
    ['8 (999) 111-22-33', '+79991112233'],
    ['+7 999 111 22 33', '+79991112233'],
    ['123', null],
  ])('normalizes %s', (input, expected) => {
    expect(normalizeAuthPhone(input)).toBe(expected)
  })
})
```

Business scenario повторно применяет то же правило на своей границе. UI validation не заменяет business validation.

## Internal tests

### TST-N007: Colocated tests дополняют public contract tests

Colocated tests оправданы для:

- mappers и normalizers;
- runtime guards и parsers;
- private error implementation;
- сложного branching;
- race/concurrency algorithms;
- reusable internal pure functions.

Отдельный test каждого service не требуется автоматически. Factory-level tests остаются главным доказательством, что внутренняя реализация подключена к public scenario правильно.

Service test добавляется, если он существенно упрощает проверку сложного внутреннего алгоритма и не дублирует целиком factory-level matrix.

## Domain errors

### TST-N008: Consumer contract ошибки тестируется без public constructor

Factory-level test проверяет observable contract:

```ts
try {
  await api.verifyPhoneOtp(data)
} catch (error) {
  expect(isAuthError(error)).toBe(true)

  if (isAuthError(error)) {
    expect(error.code).toBe(
      AUTH_ERROR_CODES.PHONE_OTP_VERIFY_CODE_INVALID,
    )
  }
}
```

Consumer-level test не использует private `AuthBusinessError` constructor и не зависит от `instanceof` internal class.

Colocated test error implementation может отдельно проверить:

- private constructor;
- `cause`;
- source code mapping;
- source metadata normalization;
- защиту от malformed error values.

## Adapter tests

### TST-N009: Adapter test проверяет port boundary, а не business behavior

Adapter test размещается рядом с adapter и проверяет:

- правильную concrete operation;
- transport payload;
- преобразование domain arguments в concrete arguments;
- raw/unknown result согласно port contract;
- проброс source error без создания domain error;
- subscription cleanup;
- отсутствие лишних SDK operations в минимальном client;
- environment boundary, если она проверяема build/lint средствами.

Adapter test не повторяет domain error mapping, business fallback и scenario orchestration.

Если несколько adapters реализуют один нетривиальный behavioral port contract, позднее можно выделить reusable contract test suite. Она остаётся test-only utility и не становится preset.

## Preset tests

### TST-N010: Production preset test проверяет assembly risk

Preset test размещается рядом с production preset и проверяет:

- выбор правильных adapters;
- передачу полного `Deps` в factory;
- exact narrowed API view, если preset его задаёт;
- отсутствие I/O при construction;
- отсутствие import-time subscriptions и storage reads;
- scope API instance;
- передачу lifecycle/dispose handles caller;
- изоляцию двух request-scoped instances;
- server/client import boundary.

Preset test не повторяет happy path и error matrix business scenarios. Эти гарантии принадлежат factory-level tests.

## Framework binding tests

### TST-N011: Framework binding тестируется через fake business API

Framework unit test по умолчанию получает fake API, а не собирает реальную factory:

```tsx
const authApi = createAuthApiFake()

render(
  <AuthProvider api={authApi}>
    <Consumer />
  </AuthProvider>,
)
```

Проверяются:

- Provider предоставляет переданный instance;
- access hook возвращает правильный API;
- использование без Provider даёт предсказуемую ошибку;
- изменение framework-neutral state вызывает framework update;
- subscriptions запускаются в правильной lifecycle phase;
- cleanup выполняется после unmount;
- Strict Mode не запускает construction side effects;
- server snapshot и hydration согласованы, если binding участвует в SSR.

Отдельный smoke test с real factory и memory ports добавляется только при самостоятельном integration risk. Такой тест принадлежит framework module либо graph owner, который действительно собирает эту связку.

## UI tests

### TST-N012: Domain UI тестируется при наличии значимого поведения

Компонент не требует test только потому, что он существует. Test оправдан, если Domain-owned UI:

- содержит interaction;
- отображает несколько domain states;
- реагирует на domain error code;
- управляет focus или keyboard navigation;
- имеет значимый accessibility contract;
- использует framework lifecycle;
- содержит регрессионно опасную presentation logic.

Проверяются observable behavior и accessibility semantics, а не внутренняя структура JSX/Vue template.

Snapshot-only tests не являются обязательным доказательством. Визуальные различия при необходимости проверяются отдельным visual regression инструментом.

Universal UI module тестируется в слое `ui`, а page/screen/composition UI тестируется у соответствующего composition owner. Наличие React/Vue само по себе не переносит ownership теста в Domain.

## Graph и E2E tests

### TST-N013: Cross-domain graph тестируется у graph owner

Проверяются:

- topological assembly order;
- передача собранных API в dependent factories;
- exact graph type;
- отсутствие повторной assembly без нужного scope;
- ownership instance;
- lifecycle start и cleanup;
- request/application/page isolation.

Business modules не содержат tests полного application graph.

### TST-N014: E2E дополняет, но не заменяет Domain tests

E2E проверяет пользовательский поток через реальный application entry. Он не заменяет factory-level tests, потому что не способен дешёво и детерминированно перебрать malformed responses, synchronous throws, races и все domain error mappings.

## Чего избегать

### TST-N015: Test suite не повторяет одну ответственность на всех уровнях

Не рекомендуется:

- повторять одну scenario matrix в service, factory, preset и framework tests;
- тестировать business через production SDK;
- использовать общий mutable API instance между tests;
- экспортировать test harness из production public API;
- создавать `presets/testing` как default-механизм unit tests;
- проверять private implementation из factory-level tests;
- считать type-only файл требующим runtime unit test;
- использовать real network или process env в business tests.

Минимальная правильная граница предпочтительнее большого количества дублирующих tests.
