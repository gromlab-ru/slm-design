# Правила SLM третьего уровня

Проект Level 3 соблюдает правила Levels 1-2, кроме заменённого `SLM-L2-DOMAIN-R001` и расширенного состава Groups внутри слоя `domains`, и дополнительные правила этого реестра.

## Граница Domain

### SLM-L3-DOMAIN-R001

> **Предметная граница Domain**
>
> Каждая самостоятельная предметная область слоя `domains` представлена ровно одним Domain; его role modules относятся только к этой области.

### SLM-L3-DOMAIN-A002

> **Корень Domain**
>
> Корень Domain не содержит файлов реализации, изменяемого состояния, ресурсов жизненного цикла, публичного API или реэкспортов и содержит только допустимые role modules и Groups.

## Business и factory

### SLM-L3-BUSINESS-R003

> **Business contract Domain**
>
> Каждый Domain содержит ровно один module `business`, который определяет публичные business scenarios, business contracts, domain errors и семантику domain state.

### SLM-L3-BUSINESS-A004

> **Изоморфный graph business**
>
> Production import graph, достижимый из public entrypoint `business`, не достигает framework code, environment boundary, platform API, concrete runtime, adapter, preset или framework module.

### SLM-L3-FACTORY-R005

> **Contract factory**
>
> Business factory получает полный набор собственных ports и создаёт стабильный business API независимо от execution environment; среда не выражается через mode, optional port или метод, намеренно недоступный в части сред.

### SLM-L3-FACTORY-R006

> **Создание API instance**
>
> Вызов business factory не выполняет ввод-вывод, не читает скрытое окружение, не запускает ресурс жизненного цикла, не выбирает concrete adapter и не выполняет framework lifecycle.

### SLM-L3-PORT-R007

> **Business-owned port**
>
> Каждая runtime capability, вызываемая business, описывается минимальным business-owned port, public contract которого не раскрывает concrete runtime, framework или environment types.

## Assembly

### SLM-L3-ADAPTER-R008

> **Ответственность adapter**
>
> Adapter преобразует concrete runtime в business port и не определяет business invariant, domain fallback или domain error.

### SLM-L3-PRESET-R009

> **Роль preset**
>
> Preset module собирает business API для одного именованного execution context выбором implementations ports и не изменяет business contract или scenarios.

### SLM-L3-ASSEMBLY-R010

> **Исполнение lifecycle contract**
>
> Graph owner удерживает API instance только в scope, объявленном module-владельцем, и вызывает предоставленные ему lifecycle operations; module-владелец определяет lifecycle contract resource по правилам Level 1.

## Междоменные и environment зависимости

### SLM-L3-DEPENDENCY-R011

> **Междоменная runtime-граница**
>
> Business одного Domain не создаёт и не импортирует runtime API другого Domain; необходимая capability описывается собственным port и передаётся graph owner при assembly.

### SLM-L3-ENVIRONMENT-A012

> **Environment import graph**
>
> Public entrypoint, обозначенный как client-only, server-only или isomorphic, не импортирует и не реэкспортирует transitive graph несовместимой среды выполнения.

## Framework и verification

### SLM-L3-FRAMEWORK-R013

> **Framework module Domain**
>
> Framework-specific code находится в module Domain, названном именем framework, получает готовый business API и не реализует business decisions или concrete adapters.

### SLM-L3-TEST-R014

> **Проверка business contract**
>
> Каждый public business scenario проверяется factory-level tests с controlled implementations ports; primary tests adapter, preset и framework module проверяют их собственную границу и не дублируют scenario matrix business.
