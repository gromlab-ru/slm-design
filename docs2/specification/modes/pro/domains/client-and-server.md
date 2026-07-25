---
title: Client и server assembly в SLM Pro
status: draft
normative: true
overlay: pro
base: slm
---

# Client и Server Assembly

> Overlay: `SLM Pro`.

`client` и `server` создают готовые runtime-specific instances одного domain поверх его business factory и adapters.

## Client assembly

```text
domains/{group...}/{domain}/client/
├── create-{domain}-client-runtime.ts
└── index.ts
```

```ts
export const createAuthClientRuntime = (): AuthRuntime => {
  return authFactory({
    phoneAuth: browserPhoneAuthAdapter,
    session: browserSessionAdapter,
  })
}
```

Client technical inputs ограничены client environment/config и platform capabilities, необходимыми для создания adapters собственного domain. Runtime values другого domain technical input не являются.

**SLM-PRO-ASM-001 - ОБЯЗАН.** Runtime imports client assembly должны ограничиваться собственной business factory, собственными client adapters, собственной React surface и необходимыми client technical inputs. Type-only foreign contracts допускаются по [SLM-PRO-XDOM-005](./cross-domain-boundary.md#type-only-contracts).

**SLM-PRO-ASM-002 - ОБЯЗАН.** Client assembly должна возвращать готовый runtime собственного domain.

Запрет на foreign runtime values определяется правилом [SLM-PRO-XDOM-001](./cross-domain-boundary.md#runtime-imports).

**SLM-PRO-ASM-004 - МОЖЕТ.** Client или server assembly может принимать готовую внешнюю capability через собственный input contract.

```ts
createUserClientRuntime({ auth: auth.session })
```

Такой input не даёт user domain права создавать AuthRuntime или импортировать его client entrypoint.

## Server assembly

```text
domains/{group...}/{domain}/server/
├── create-{domain}-server-runtime.ts
└── index.ts
```

Server technical inputs ограничены request/framework data, server environment/config и platform capabilities, необходимыми для создания server adapters собственного domain. Runtime values другого domain technical input не являются.

**SLM-PRO-ASM-005 - ОБЯЗАН.** Server assembly должна создавать новый runtime в scope, соответствующем request или другой явно выбранной server lifetime.

**SLM-PRO-ASM-006 - ЗАПРЕЩЕНО.** Server assembly не может повторно использовать adapter или runtime instance, захвативший request credentials, cookies, headers или user-specific state другого scope.

**SLM-PRO-ASM-007 - ОБЯЗАН.** Framework/request input используется только для создания server adapters и не протекает как raw framework object в business API.

**SLM-PRO-ASM-008 - ОБЯЗАН.** Server entrypoint должен иметь явный server-only marker, если framework предоставляет такой механизм.

**SLM-PRO-ASM-016 - ОБЯЗАН.** Runtime imports server assembly должны ограничиваться собственной business factory, собственными server adapters и необходимыми server technical inputs; runtime import React/client surface запрещён. Type-only foreign contracts допускаются по [SLM-PRO-XDOM-005](./cross-domain-boundary.md#type-only-contracts).

## Constructor и activation

Assembly определяет способ создания, но не владеет полным cross-domain graph.

Отсутствие product request, socket connection и background resource при вызове runtime creator определяется base-правилом `SLM-LIFE-002`.

```text
module import
  → определяет creator

creator call
  → создаёт runtime instance

explicit start
  → запускает resources
```

**SLM-PRO-ASM-010 - ОБЯЗАН.** Resources запускает composition scope owner в выбранном scope согласно [lifecycle rules](../../../runtime-and-lifecycle.md).

## Public entrypoints

**SLM-PRO-CMP-004 - ЗАПРЕЩЕНО.** Composition не может повторять adapter wiring, если domain public assembly уже создаёт готовый runtime.

**SLM-PRO-CMP-013 - ОБЯЗАН.** Composition должна использовать public client/server creator domain, если domain предоставляет runtime-specific assembly.

**SLM-PRO-CMP-014 - МОЖЕТ.** Composition может вызвать public business factory напрямую только для universal domain, у которого нет external ports, concrete adapters и runtime-specific input.

**SLM-PRO-ASM-011 - ОБЯЗАН.** Client и server assembly должны иметь разные public entrypoints.

**SLM-PRO-ASM-012 - ЗАПРЕЩЕНО.** Общий domain barrel не может runtime-реэкспортировать одновременно client и server surfaces.

## Server/client bridge

Client и server runtimes являются разными instances над общей business semantics.

Запрет на передачу DomainRuntime, functions, Context, store или query client через serializable server/client boundary определяется правилом [SLM-DATA-012](../../../state-and-data.md#serializable-boundaries).

**SLM-PRO-ASM-014 - МОЖЕТ.** Server может передать client assembly только serializable business-owned bootstrap data без secrets и mutable runtime objects.
