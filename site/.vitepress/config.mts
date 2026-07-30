import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitepress'

const repositoryUrl = 'https://github.com/gromlab-ru/slm-design'
const viteConfigPath = fileURLToPath(new URL('../vite.config.mts', import.meta.url))

function slugifyHeading(value: string) {
  const slug = value
    .replace(/<[^>]+>/g, '')
    .replace(/`/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}_-]/gu, '')
    .replace(/-+/g, '-')

  return ['app', 'compositions', 'infra', 'ui', 'shared'].includes(slug)
    ? `layer-${slug}`
    : slug
}

const levelOneSidebar = [
  {
    text: 'SLM Level 1',
    items: [
      { text: 'Обзор', link: '/level-1/' },
      { text: 'Терминология', link: '/level-1/terminology' },
      { text: 'Слои', link: '/level-1/layers' },
      { text: 'Зависимости', link: '/level-1/dependencies' },
      { text: 'Модули', link: '/level-1/modules' },
      { text: 'Группы', link: '/level-1/groups' },
      { text: 'Сегменты', link: '/level-1/segments' },
      { text: 'Компоненты', link: '/level-1/components' },
      { text: 'Вложенные модули', link: '/level-1/nested-modules' },
      { text: 'Жизненный цикл', link: '/level-1/lifecycle' },
      { text: 'Проверка', link: '/level-1/validation' },
    ],
  },
  {
    text: 'Правила',
    items: [
      { text: 'Как устроены правила', link: '/rules/' },
      { text: 'Реестр Level 1', link: '/rules/level-1' },
    ],
  },
]

const rulesSidebar = [
  {
    text: 'Правила SLM',
    items: [
      { text: 'Формат и классификация', link: '/rules/' },
      { text: 'Правила Level 1', link: '/rules/level-1' },
    ],
  },
  {
    text: 'Документация',
    items: [
      { text: 'Обзор Level 1', link: '/level-1/' },
      { text: 'Проверка', link: '/level-1/validation' },
    ],
  },
]

export default defineConfig({
  srcDir: '../DRAFT',
  srcExclude: ['README.md', 'domains/**'],
  rewrites: {
    'level-1/README.md': 'level-1/index.md',
    'rules/README.md': 'rules/index.md',
  },
  title: 'SLM Design',
  description: 'Базовая архитектура фронтенд-приложений SLM Level 1',
  lang: 'ru-RU',
  base: '/slm-design/',
  cleanUrls: true,
  lastUpdated: true,
  sitemap: {
    hostname: 'https://gromlab-ru.github.io/slm-design/',
  },
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/slm-design/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#d97706' }],
  ],
  markdown: {
    anchor: {
      slugify: slugifyHeading,
    },
  },
  vite: {
    configFile: viteConfigPath,
  },
  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'SLM Design',
    nav: [
      { text: 'Level 1', link: '/level-1/' },
      { text: 'Правила', link: '/rules/level-1' },
    ],
    sidebar: {
      '/level-1/': levelOneSidebar,
      '/rules/': levelOneSidebar,
    },
    socialLinks: [{ icon: 'github', link: repositoryUrl }],
    search: {
      provider: 'local',
      options: {
        detailedView: false,
        disableQueryPersistence: true,
        translations: {
          button: {
            buttonText: 'Поиск по документации',
            buttonAriaLabel: 'Поиск по документации или коду правила',
          },
          modal: {
            displayDetails: 'Показать подробности',
            resetButtonTitle: 'Сбросить поиск',
            backButtonTitle: 'Закрыть поиск',
            noResultsText: 'Ничего не найдено',
            footer: {
              selectText: 'выбрать',
              navigateText: 'перейти',
              closeText: 'закрыть',
            },
          },
        },
      },
    },
    outline: { level: [2, 3], label: 'На этой странице' },
    notFound: {
      code: '404',
      title: 'Страница не найдена',
      quote: 'Запрошенная страница отсутствует в документации Level 1.',
      linkLabel: 'Перейти на главную',
      linkText: 'Вернуться к документации',
    },
    editLink: {
      pattern: `${repositoryUrl}/edit/master/DRAFT/:path`,
      text: 'Предложить изменение',
    },
    lastUpdated: {
      text: 'Обновлено',
      formatOptions: { dateStyle: 'medium' },
    },
    docFooter: {
      prev: 'Предыдущая страница',
      next: 'Следующая страница',
    },
    darkModeSwitchLabel: 'Оформление',
    lightModeSwitchTitle: 'Светлая тема',
    darkModeSwitchTitle: 'Тёмная тема',
    sidebarMenuLabel: 'Содержание',
    returnToTopLabel: 'Наверх',
    skipToContentLabel: 'Перейти к содержанию',
    footer: {
      message: 'SLM Level 1',
      copyright: 'Рабочий черновик архитектуры.',
    },
  },
})
