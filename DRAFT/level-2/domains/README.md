# Доменные пакеты Level 2

Доменный пакет заменяет один выбранный доменный модуль Level 1. Он объединяет SLM-модули одной предметной области вокруг контролируемого Domain API, но сам не является модулем, Group или публичным API.

```text
domains/auth/
├── api/                       # Обязательный модуль
├── adapters/                  # При наличии dependency ports
├── assemblies/
│   └── default/               # Обязательная штатная assembly
└── react/
    ├── session/
    └── queries/
```

Другие предметные области того же SLM root могут оставаться доменными модулями Level 1.

## Основные границы

- [Доменный пакет](./domain-package.md) определяет предметную и структурную policy boundary.
- [Domain API](./domain-api.md) является единственным семантическим шлюзом к данным и операциям домена.
- [Фабрики, ports и adapters](./factory-ports-adapters.md) изолируют SDK, backend, storage, runtime capabilities и provider failures.
- [Assemblies](./assemblies.md) содержат обязательную штатную сборку `default` и дополнительные production-контексты.
- [Состояние и кэш](./state-cache.md) принадлежат framework bindings или compositions: они могут хранить framework metadata и UI-state, но materialize domain payload только из значений Domain API.
- [Framework Groups](./framework-bindings.md) содержат domain-specific SLM-модули фреймворка.
- [Realtime](./realtime.md) задаёт messages, subscriptions, correlation, resync, errors и cleanup.
- [Тестирование](./testing.md) проверяет Domain API через фабрики, adapters через port contracts и assemblies через production wiring.
- [Переход auth](./auth-example.md) показывает локальный переход с Level 1 без big-bang всего root.
- [Открытые вопросы](./open-questions.md) отделяют принятые решения от ещё не нормированных деталей.

Точные блокирующие требования объявлены только в [реестре правил Level 2](../../rules/level-2.md).
