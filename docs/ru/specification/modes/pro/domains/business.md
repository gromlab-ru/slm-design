---
title: Business в SLM Pro
status: draft
normative: true
overlay: pro
base: slm
---

# Business

> Overlay: `SLM Pro`.

`business` является framework-neutral зоной domain и единственным владельцем его продуктовой semantics.

## Структура

```text
domains/{group...}/{domain}/business/
├── {domain}.factory.ts
├── index.ts
├── types/
├── ports/
├── services/
├── errors/
├── mappers/
├── selectors/
├── validators/
└── lib/
```

Конкретный набор внутренних segments определяется размером domain. Обязательны роль factory и public boundary, но не каждая папка из примера.

## Factory boundary

**SLM-PRO-BUS-001 - ОБЯЗАН.** Business должен создавать public runtime API через factory `{domain}Factory`.

**SLM-PRO-BUS-002 - ОБЯЗАН.** Factory должна принимать все runtime capabilities через business-owned dependency contracts.

**SLM-PRO-BUS-003 - ОБЯЗАН.** Factory должна возвращать framework-neutral DomainRuntime. Stateless logic API считается DomainRuntime и соблюдает тот же public boundary.

**SLM-PRO-BUS-004 - ЗАПРЕЩЕНО.** Factory не может возвращать React hooks, components, Providers, layouts, route guards или framework boundaries.

**SLM-PRO-BUS-005 - ЗАПРЕЩЕНО.** Factory constructor не может выполнять I/O, открывать socket, регистрировать subscription, запускать timer или читать hidden environment.

## Public API

**SLM-PRO-BUS-006 - ОБЯЗАН.** `business/index.ts` должен экспортировать единственное runtime value: factory.

**SLM-PRO-BUS-007 - МОЖЕТ.** `business/index.ts` может экспортировать business-owned types через `export type`.

```ts
export { authFactory } from './auth.factory'

export type {
  AuthDeps,
  AuthFactory,
  AuthRuntime,
  AuthState,
} from './types'
```

**SLM-PRO-BUS-008 - ЗАПРЕЩЕНО.** Error classes, error guards, error code constants, selectors, validators, formatters, services, mappers и port implementations не экспортируются как отдельные runtime values.

Если внешнему consumer нужна такая capability, она должна быть осмысленной частью factory runtime API, а не обходным direct export.

## Runtime API

DomainRuntime может предоставлять:

- commands;
- imperative queries;
- snapshots;
- subscriptions;
- selectors через стабильные methods;
- validation operations;
- typed outcomes;
- explicit lifecycle operations.

**SLM-PRO-BUS-009 - ОБЯЗАН.** Runtime API должен говорить на языке domain и не повторять endpoint names, SDK tree или storage schema.

**SLM-PRO-BUS-010 - ЗАПРЕЩЕНО.** Public contract не может раскрывать generated DTO, SDK client, query-library result, concrete store API, raw Context или adapter.

## Dependencies и ports

**SLM-PRO-BUS-011 - ОБЯЗАН.** Business-owned dependency описывает минимальную внешнюю возможность на языке domain.

```ts
export type AuthPhonePort = {
  requestCode: (phone: string) => Promise<unknown>
  verifyCode: (input: VerifyPhoneCodeInput) => Promise<unknown>
}
```

**SLM-PRO-BUS-012 - ОБЯЗАН.** Ненадёжный внешний результат должен приниматься как `unknown`, если business обязан проверить его runtime-форму.

**SLM-PRO-BUS-013 - ЗАПРЕЩЕНО.** Business dependency не может быть generated DTO, полный SDK client, `StoreApi`, QueryClient или framework hook.

**SLM-PRO-BUS-014 - ОБЯЗАН.** Subscription port должен предоставлять cleanup contract.

## Imports

Business может runtime-импортировать:

- собственные файлы;
- детерминированный `shared`;
- pure libraries без I/O, hidden state и public type leakage.

Business может type-only импортировать стабильный public contract другого domain, если dependency невозможно корректно описать локальным port. Локальный consumer-owned port является предпочтительным вариантом.

**SLM-PRO-BUS-015 - ЗАПРЕЩЕНО.** Business не импортирует React, query runtime, state manager, SDK, generated operation, HTTP client, storage implementation, browser API, infra, composition или assembly.

Cross-domain imports дополнительно регулируются правилами `SLM-PRO-XDOM-*` в [Cross-domain boundary](./cross-domain-boundary.md).

## Normalization и errors

**SLM-PRO-BUS-017 - ОБЯЗАН.** External result должен быть нормализован в business-owned model до выхода из DomainRuntime.

**SLM-PRO-BUS-018 - ОБЯЗАН.** Malformed successful response должен считаться нарушением runtime contract, а не валидным отсутствием данных.

**SLM-PRO-BUS-019 - ОБЯЗАН.** Expected domain outcome и technical failure должны быть различимы в public contract.

**SLM-PRO-BUS-020 - ЗАПРЕЩЕНО.** Source error, HTTP status, SDK error class, raw response и transport message не могут быть consumer contract.

Business может выражать ожидаемые outcomes через typed result или domain error. Эта draft-версия не предписывает единственную форму обработки ожидаемых ошибок, но требует business-owned semantics и стабильных discriminants.

## State

**SLM-PRO-BUS-021 - ОБЯЗАН.** Business владеет domain state model, допустимыми transitions и semantics commands/selectors.

Framework-neutral state runtime может быть создан самой factory или предоставлен через business-owned port. Concrete store implementation остаётся запрещённой dependency по [SLM-PRO-BUS-015](#imports) и не раскрывается в public API.
