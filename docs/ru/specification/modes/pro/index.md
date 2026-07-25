---
title: SLM Pro
status: draft
normative: true
overlay: pro
base: slm
---

# SLM Pro

`SLM Pro` является независимым overlay непосредственно над [base SLM](../../index.md).

```text
SLM Pro = SLM + Pro rules
```

## Отличия от SLM

| Область | Base SLM | SLM Pro |
|---|---|---|
| Product ownership | Product logic принадлежит compositions | Устойчивая product responsibility принадлежит изолированному domain |
| Слои | `app`, `compositions`, `infra`, `ui`, `shared` | Добавляется `domains` |
| Структура domain | Отсутствует | `business`, framework surface, adapters, client/server assembly |
| Domain dependencies | Отсутствуют | Cross-domain runtime imports запрещены, capabilities передаются composition |
| External integration | Composition использует infra | Private domain adapter реализует business-owned port |
| Testing | Risk-based base tests | Обязательные tests для используемых factory, adapter, assembly и graph boundaries |

## Расширение архитектурной модели

**SLM-PRO-ARCH-001 - ОБЯЗАН.** SLM Pro должен расширять набор base-слоёв слоем `domains` для изолированных product responsibilities.

```text
src/
├── app/
├── compositions/
├── domains/
├── infra/
├── ui/
└── shared/
```

**SLM-PRO-ARCH-002 - ОБЯЗАН.** Дополнительные dependency edges Pro должны соответствовать следующему направлению:

```text
compositions -> domains
domains -> согласно внутренним Pro zones
```

Base dependency direction для остальных слоёв сохраняется.

**SLM-PRO-CMP-010 - МОЖЕТ.** Composition module может импортировать public entrypoints Pro domains в дополнение к imports, разрешённым base-правилом `SLM-BASE-CMP-010`.

## Pro Domain Specification

Полная Pro-модель слоя описана в [Domains](./domains/index.md). Других mode-specific отличий текущий draft Pro не вводит.
