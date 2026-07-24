---
title: Client и server assembly domain
status: draft
normative: true
---

# Client и Server Assembly

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

**SLM-ASM-001 - ОБЯЗАН.** Client assembly может импортировать только собственную business factory, собственные client adapters, собственную React surface и необходимые runtime-specific technical inputs.

**SLM-ASM-002 - ОБЯЗАН.** Client assembly должна возвращать готовый runtime собственного domain.

**SLM-ASM-003 - ЗАПРЕЩЕНО.** Client assembly одного domain не может импортировать creator или runtime другого domain.

**SLM-ASM-004 - МОЖЕТ.** Client assembly может принимать готовую внешнюю capability через собственный input contract.

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

**SLM-ASM-005 - ОБЯЗАН.** Server assembly должна создавать новый runtime в scope, соответствующем request или другой явно выбранной server lifetime.

**SLM-ASM-006 - ЗАПРЕЩЕНО.** Request credentials, cookies, headers и user-specific state не могут сохраняться в process-level mutable singleton.

**SLM-ASM-007 - ОБЯЗАН.** Framework/request input используется только для создания server adapters и не протекает как raw framework object в business API.

**SLM-ASM-008 - ОБЯЗАН.** Server entrypoint должен иметь явный server-only marker, если framework предоставляет такой механизм.

**SLM-ASM-015 - МОЖЕТ.** Server assembly может принимать готовую внешнюю capability через собственный input contract на тех же условиях, что и client assembly.

**SLM-ASM-016 - ОБЯЗАН.** Server assembly может импортировать только собственную business factory, собственные server adapters и необходимые server technical inputs; импорт React/client surface запрещён.

## Constructor и activation

Assembly определяет способ создания, но не владеет полным cross-domain graph.

**SLM-ASM-009 - ЗАПРЕЩЕНО.** Вызов runtime creator не должен выполнять product request, открывать socket или запускать background resource.

```text
module import
  → определяет creator

creator call
  → создаёт runtime instance

explicit start
  → запускает resources
```

**SLM-ASM-010 - ОБЯЗАН.** Resources запускает graph owner в выбранном scope согласно [lifecycle rules](../../runtime-and-lifecycle.md).

## Public entrypoints

**SLM-ASM-011 - ОБЯЗАН.** Client и server assembly должны иметь разные public entrypoints.

**SLM-ASM-012 - ЗАПРЕЩЕНО.** Общий domain barrel не может runtime-реэкспортировать одновременно client и server surfaces.

## Server/client bridge

Client и server runtimes являются разными instances над общей business semantics.

**SLM-ASM-013 - ЗАПРЕЩЕНО.** DomainRuntime, functions, Context, store или query client нельзя передавать через serializable server/client boundary.

**SLM-ASM-014 - МОЖЕТ.** Server может передать client assembly только serializable business-owned bootstrap data без secrets и mutable runtime objects.
