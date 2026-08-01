export default {
  name: 'slm-design',
  source: 'SKILL.md',
  references: [
    {
      source: 'DRAFT',
      target: 'reference/draft',
      include: ['README.md', 'rules', 'level-1', 'level-2'],
    },
  ],
  legacyMarkers: ['old-docs', 'reference/canons', 'reference/slm-design'],
};
