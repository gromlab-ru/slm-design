---
title: Сегменты
status: draft
normative: true
---

# Сегменты

Segment группирует внутренние файлы module по устойчивой роли. Segment не является самостоятельным layer или module.

## Базовые segments

| Segment | Роль |
|---|---|
| `ui/` | Presentation components текущего module |
| `parts/` | Nested modules текущего module |
| `hooks/` | Framework hooks текущей ответственности |
| `providers/` | Provider implementations текущего module |
| `stores/` | Concrete state runtime текущего owner |
| `services/` | Scenario operations и service objects |
| `mappers/` | Transformation на границе ответственности |
| `types/` | Types текущего module |
| `styles/` | Styles текущего module |
| `lib/` | Небольшие internal utilities |
| `config/` | Constants и configuration текущего module |
| `tests/` | Tests публичной границы или составного runtime |

## Правила

**SLM-SEG-001 - МОЖЕТ.** Module может использовать любые необходимые segments и не обязан создавать остальные.

**SLM-SEG-002 - ЗАПРЕЩЕНО.** Нельзя создавать полный симметричный набор segments как scaffold без реального содержимого.

**SLM-SEG-003 - ОБЯЗАН.** Если файл помещён в segment, роль segment должна соответствовать фактической роли файла, а не только его расширению или имени. Файлы могут оставаться в корне небольшого module.

**SLM-SEG-004 - ЗАПРЕЩЕНО.** Segment не имеет внешнего public API независимо от module owner.

Запрет deep import в segment другого module определяется base-правилом `SLM-API-002`.

## UI и Parts

`ui/` содержит presentation components без самостоятельного architectural ownership.

`parts/` содержит nested modules с собственной внутренней структурой и локальным public boundary.

**SLM-SEG-006 - ОБЯЗАН.** Сущность с самостоятельной ответственностью, внешними архитектурными dependencies или nested modules должна размещаться в `parts`, а не маскироваться как плоский component. Локальные presentation hooks/state сами по себе не требуют `parts`.

## Hooks

**SLM-SEG-007 - ОБЯЗАН.** Hook принадлежит тому module, чью ответственность и runtime он выражает.

Примеры:

- product hook - владеющий product module;
- page-local hook - владеющая page composition;
- reusable technical hook - соответствующий infra module;
- product-agnostic UI hook - владеющий UI module.

Segments являются только внутренними организационными ролями и не вводят дополнительных архитектурных zones.
