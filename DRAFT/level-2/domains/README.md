# Доменные пакеты Level 2

Доменный пакет заменяет один выбранный доменный модуль Level 1. Он объединяет SLM-модули одной предметной области, но сам не является модулем, Group или публичным API.

```text
domains/auth/
├── business/
├── assemblies/               # Обязательная Group
├── adapters/                 # При наличии technical dependencies
└── react/
    ├── session/
    └── login-form/
```

Другие предметные области того же SLM root могут оставаться доменными модулями Level 1.

## Основные границы

- [Доменный пакет](./domain-package.md) определяет предметную и структурную policy boundary.
- [Business](./business.md) владеет Domain API и разделяет public types, factories и необязательный deterministic runtime.
- [Фабрики, зависимости и adapters](./factory-ports-adapters.md) изолируют runtime-capabilities, включая state/query runtime и недетерминизм.
- [Assemblies](./assemblies.md) обязательны и собирают именованный граф нужных API для реального контекста.
- [Состояние и кэш](./state-cache.md) разделяет предметную власть business и технические проекции.
- [Framework Groups](./framework-bindings.md) содержат domain-specific SLM-модули фреймворка.
- [Тестирование](./testing.md) проверяет каждого владельца через его публичную границу.
- [Переход auth](./auth-example.md) показывает локальный переход с Level 1 без big-bang всего root.
- [Открытые вопросы](./open-questions.md) отделяют принятые решения от ещё не нормированных деталей.

Точные блокирующие требования объявлены только в [реестре правил Level 2](../../rules/level-2.md).
