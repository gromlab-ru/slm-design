export default {
  name: 'slm-design',
  source: 'SKILL.md',
  requiredHeadings: [
    'Источники истины',
    'Рабочий режим',
    'Сбор контекста',
    'Проектирование',
    'Реализация изменений',
    'Архитектурное ревью',
    'Миграция',
    'Проверка результата',
    'Stop conditions',
    'Карта файлов',
  ],
  references: [
    {
      source: 'docs',
      target: 'reference/docs',
      include: ['.'],
    },
  ],
  referenceMap: {
    heading: 'Карта файлов',
    target: 'reference/docs',
  },
  legacyMarkers: [
    'DRAFT/',
    'reference/draft',
    'old-docs',
    'reference/canons',
    'reference/slm-design',
  ],
};
