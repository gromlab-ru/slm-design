---
title: Тестирование и соответствие
status: draft
normative: true
---

# Тестирование и Соответствие

Тесты проверяют public boundaries и runtime risks каждого owner. Base SLM не требует создавать неиспользуемые архитектурные конструкции ради тестовой формы.

## Risk-based tests

**SLM-BASE-TEST-018 - ОБЯЗАН.** Tests изменённого module должны покрывать применимые риски его public behavior, data boundaries и lifecycle.

Типичные риски:

- public behavior;
- malformed external data;
- rejected dependencies;
- state transitions;
- lifecycle activation и cleanup;
- request и identity isolation;
- client/server boundary;
- отсутствие import-time I/O.

**SLM-BASE-TEST-008 - ОБЯЗАН.** Client/server import boundary должна проверяться инструментом, понимающим реальный framework module graph, если application имеет раздельные environment entries. DOM unit test не заменяет production build probe.

Mode-specific test suites принадлежат overlay, который вводит соответствующие конструкции.

## Architecture conformance

Типичные mechanically enforceable checks:

- направление imports;
- deep imports;
- public entrypoints;
- runtime cycles;
- заявленный overlay и его rule set;
- unique rule IDs документации;
- generated artifacts, если они используются.

**SLM-BASE-TEST-011 - ЗАПРЕЩЕНО.** Документированное правило не считается mechanically enforced, если repository tooling его фактически не проверяет.

## Единица соответствия

**SLM-BASE-TEST-014 - ОБЯЗАН.** Application соответствует base SLM, если выполняет все base-правила. Соответствие заявленному overlay оценивается как base-правила с учётом точного scope каждой замены плюс полный rule set выбранного overlay.

**SLM-BASE-TEST-015 - ОБЯЗАН.** Изменение соответствует заявленной архитектуре, если новые и изменённые modules не создают новых нарушений применимых base-правил или правил выбранного overlay и проходят существующие checks.

**SLM-BASE-TEST-016 - ОБЯЗАН.** Отступление от правила `СЛЕДУЕТ` должно быть зафиксировано в архитектурном review или принятом decision с указанием причины и scope.

**SLM-BASE-TEST-017 - ОБЯЗАН.** Manual conformance и mechanical enforcement должны различаться явно; отсутствие автоматической проверки не отменяет применимое нормативное правило.

## Completion gate

**SLM-BASE-TEST-012 - ОБЯЗАН.** Изменение считается завершённым только после выполнения ближайших tests, typecheck, lint, build и architecture checks, существующих в repository.

**SLM-BASE-TEST-013 - ОБЯЗАН.** Невыполненная проверка и остаточный риск должны быть явно указаны в результате работы.
