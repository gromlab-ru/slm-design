---
title: Архитектурные modes
status: draft
normative: true
---

# Архитектурные Modes

SLM является самостоятельной базовой архитектурой. Architecture mode - опциональный независимый overlay, который добавляет или явно заменяет отдельные правила base SLM.

```text
SLM Advanced = SLM + Advanced rules
SLM Pro      = SLM + Pro rules
```

`SLM Advanced` и `SLM Pro` не наследуют друг друга. Совпадающее требование декларируется отдельно внутри каждого overlay и не создаёт общей mode-ветки.

## Выбор архитектуры

Приложение использует один из трёх вариантов:

```text
SLM
SLM + Advanced
SLM + Pro
```

**SLM-BASE-MODE-001 - ОБЯЗАН.** Приложение должно зафиксировать использование base SLM и, при наличии, ровно одного overlay: `Advanced` или `Pro`.

**SLM-BASE-MODE-002 - ЗАПРЕЩЕНО.** Одно приложение не может одновременно заявлять соответствие `SLM Advanced` и `SLM Pro`.

**SLM-BASE-MODE-003 - ОБЯЗАН.** Выбранный overlay должен применяться ко всему приложению в пределах одной SLM application boundary.

Выбор выполняет команда на стадии планирования. Сигналами могут быть количество product responsibilities, связанность modules, runtime state, client/server execution, lifecycle risks и количество команд разработки. Фиксированные числовые пороги не устанавливаются.

| Вариант | Когда рассматривать |
|---|---|
| `SLM` | Product responsibilities удобно удерживать внутри compositions без дополнительного слоя |
| `SLM Advanced` | Нужны самостоятельные domains, но команда хочет свободно выбирать их внутреннюю структуру и связи |
| `SLM Pro` | Нужны изолированные domains, явные runtime contracts, adapters, lifecycle и усиленные checks |

## Применимость правил

Base-правило имеет идентификатор вида:

```text
SLM-BASE-AREA-NNN
```

Mode-specific правила имеют идентификаторы:

```text
SLM-ADV-AREA-NNN
SLM-PRO-AREA-NNN
```

**SLM-BASE-MODE-004 - ОБЯЗАН.** Base-правила SLM применяются при любом выбранном варианте архитектуры. Если overlay явно заменяет base rule только в определённом scope, исходное base-правило продолжает действовать за пределами этого scope.

**SLM-BASE-MODE-005 - ОБЯЗАН.** Для `SLM Advanced` применяются только base-правила и правила из `modes/advanced`.

**SLM-BASE-MODE-006 - ОБЯЗАН.** Для `SLM Pro` применяются только base-правила и правила из `modes/pro`.

**SLM-BASE-MODE-007 - ЗАПРЕЩЕНО.** Правило другого overlay не может использоваться как обязательное требование, разрешение или исключение.

**SLM-BASE-MODE-008 - ОБЯЗАН.** Mode-specific правило, заменяющее base-поведение, должно явно назвать заменяемый base rule ID или нормативный раздел и точный scope замены.

## Независимые overlays

### SLM Advanced

[SLM Advanced](./modes/advanced/index.md) описывает полный Advanced-delta относительно base SLM.

### SLM Pro

[SLM Pro](./modes/pro/index.md) описывает полный Pro-delta относительно base SLM.

## Изменение overlay

**SLM-BASE-MODE-009 - МОЖЕТ.** Команда может подключить, заменить или удалить overlay при изменении требований к архитектуре.

**SLM-BASE-MODE-010 - ОБЯЗАН.** После изменения конфигурации приложение может заявлять соответствие только после выполнения применимых base-правил с учётом scoped replacements и, при наличии, полного rule set выбранного overlay.
