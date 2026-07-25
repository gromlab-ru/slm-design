---
title: SLM Advanced
status: draft
normative: true
overlay: advanced
base: slm
---

# SLM Advanced

`SLM Advanced` является независимым overlay непосредственно над [base SLM](../../index.md).

```text
SLM Advanced = SLM + Advanced rules
```

## Отличия от SLM

| Область | Base SLM | SLM Advanced |
|---|---|---|
| Product ownership | Product logic принадлежит compositions | Устойчивая product responsibility может быть извлечена в domain |
| Слои | `app`, `compositions`, `infra`, `ui`, `shared` | Добавляется `domains` |
| Структура domain | Отсутствует | Свободная, внутренние роли выбирает команда |
| Domain dependencies | Отсутствуют | Ацикличные imports через public API разрешены |
| External integration | Composition использует infra | Domain может использовать infra напрямую |

## Расширение архитектурной модели

**SLM-ADV-ARCH-001 - ОБЯЗАН.** SLM Advanced должен расширять набор base-слоёв слоем `domains` для самостоятельных product responsibilities.

```text
src/
├── app/
├── compositions/
├── domains/
├── infra/
├── ui/
└── shared/
```

**SLM-ADV-ARCH-002 - ОБЯЗАН.** Дополнительные dependency edges Advanced должны соответствовать следующему направлению:

```text
compositions -> domains
domains -> domains | infra | ui | shared
```

Base dependency direction для остальных слоёв сохраняется.

## Изменение product ownership

**SLM-ADV-CMP-001 - ОБЯЗАН.** Если product responsibility получила domain owner, Advanced заменяет для этой ответственности base-правило `SLM-CMP-001`: domain владеет собственной product logic, а composition владеет application flow и связывает public APIs.

Product logic без domain owner продолжает следовать base SLM и принадлежит минимальной composition.

**SLM-ADV-CMP-010 - МОЖЕТ.** Composition module может импортировать public API Advanced domains в дополнение к imports, разрешённым base-правилом `SLM-CMP-010`.

## Advanced Domain Specification

Полная Advanced-модель слоя описана в [Domains](./domains.md). Других mode-specific отличий текущий draft Advanced не вводит.
