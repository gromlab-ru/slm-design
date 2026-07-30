# Тестирование Domain

> Verification границ и behavior Level 3.

## Связанное правило

- [`SLM-L3-TEST-R014`](../../rules/level-3.md#slm-l3-test-r014)
- [`SLM-L3-FACTORY-R006`](../../rules/level-3.md#slm-l3-factory-r006)
- [`SLM-L3-ASSEMBLY-R010`](../../rules/level-3.md#slm-l3-assembly-r010)

## Принцип размещения

Тест живёт у module-владельца проверяемой ответственности. У Domain нет общей корневой папки `tests/`.

| Проверяемая граница | Владелец теста |
|---|---|
| Business scenarios, state и domain errors | `business` |
| Pure rule, mapper, parser или guard | Colocated segment `business` |
| Concrete port implementation | Adapter |
| Wiring, scope и cleanup assembly | Preset |
| Provider, hook и React lifecycle | `react` |
| Cross-domain graph | Composition graph owner |
| Полный пользовательский поток | E2E entry приложения |

## Factory-level tests

Factory-level tests являются главным доказательством public business behavior. Они импортируют только public API `business` и передают controlled ports:

```ts
import {
  AUTH_ERROR_CODES,
  authFactory,
  isAuthError,
} from '@/domains/auth/business'

it('maps source failure to domain error', async () => {
  const requestCode = vi.fn().mockRejectedValue(new Error('Network failed'))
  const api = authFactory(createAuthTestDeps({ requestCode }))

  await expect(api.requestPhoneOtp('+79991112233')).rejects.toMatchObject({
    code: AUTH_ERROR_CODES.PHONE_OTP_REQUEST_FAILED,
  })
})
```

Factory-level suite проверяет форму public API, отсутствие side effects при construction, happy path, input validation, malformed port result, rejected promise, synchronous throw, domain error code, порядок effects, state transitions и значимые concurrent calls.

Business test не использует React, production SDK, storage или production preset. Если scenario нельзя проверить без них, runtime boundary проникла внутрь business.

## Test harness

Private test harness уменьшает boilerplate, но не является preset:

```ts
const { api, ports, state } = createAuthTestHarness({ requestCode })
```

Harness создаёт новый instance на каждый test case, допускает scenario-specific overrides и не экспортируется через production entrypoint. `presets/testing` не создаётся по умолчанию.

## Тесты остальных ролей

Adapter test проверяет concrete operation, transport payload, mapping аргументов, raw result/error согласно port contract и subscription cleanup. Он не повторяет domain error mapping или scenario matrix.

Preset test проверяет полный набор ports, выбор adapters, отсутствие I/O при construction, scope instance, передачу cleanup handle и server/client import boundary. Он не повторяет happy path business.

React test получает fake `AuthApi` и проверяет Provider, access hook, update по `subscribe`, cleanup после unmount и поведение в Strict Mode. Smoke test с real factory добавляется только при отдельном integration risk.

## Минимальный набор

Файл test создаётся вместе с реальным risk, а не ради scaffold. Однако public business scenario не считается завершённым без factory-level tests; production preset без assembly test; adapter с нетривиальным transport mapping без adapter test; React binding с lifecycle behavior без framework test.
