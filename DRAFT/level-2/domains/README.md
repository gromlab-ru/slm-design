# Доменные пакеты Level 2

Доменный пакет заменяет корневой доменный модуль Level 1. Он объединяет SLM-модули одной предметной области, но сам не является модулем, Group или публичным API.

```text
domains/auth/
├── business/
├── presets/                  # Обязательная Group
├── adapters/                 # При наличии technical dependencies
└── react/
    ├── session/
    └── login-form/
```

## Основные границы

- [Доменный пакет](./domain-package.md) определяет предметную и структурную границу.
- [Business](./business.md) владеет `DomainApi` и разделяет public types, factory и error runtime по трём фасетам.
- [Фабрика, зависимости и adapters](./factory-ports-adapters.md) требуют отдельный SLM-модуль для каждой production adapter implementation.
- [Presets](./presets.md) обязательны и собирают один API для нужных окружений.
- [Framework Groups](./framework-bindings.md) содержат domain-specific SLM-модули фреймворка.
- [Тестирование](./testing.md) проверяет каждого владельца через его публичную границу.
- [Миграция auth](./auth-example.md) показывает переход с Level 1.
- [Открытые вопросы](./open-questions.md) отделяют принятые решения от ещё не нормированных деталей.

Точные блокирующие требования объявлены только в [реестре правил Level 2](../../rules/level-2.md).
