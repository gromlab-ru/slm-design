# SLM Design 2.0 Draft

`site/` содержит VitePress-конфигурацию, тему и статические ресурсы сайта SLM Design.

Новый publishable corpus находится в `docs/`. Действующая legacy-документация и reference текущего skill находятся в `old-docs/` до отдельного решения о принятии новой спецификации.

## Точка входа

[SLM Design Specification](../docs/ru/specification/index.md)

Specification определяет base SLM и два независимых [architecture modes](../docs/ru/specification/architecture-modes.md): `SLM Advanced` и `SLM Pro`. Каждый mode является отдельным overlay непосредственно над base SLM.

## Границы текущего этапа

На этом этапе в `docs/ru/specification/` размещается только нормативная русская спецификация. Английский раздел зарезервирован под будущий перевод. Учебные материалы, руководства, примеры, справочники и agent skill будут проектироваться после стабилизации правил.

## Локальный запуск

```bash
npm run docs:dev
```

Production build создаётся командой `npm run docs:build`.
