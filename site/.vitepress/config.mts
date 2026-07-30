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

  return ['app', 'compositions', 'domains', 'infra', 'ui', 'shared'].includes(slug)
    ? `layer-${slug}`
    : slug
}

const documentationSidebar = [
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
    text: 'SLM Level 2',
    items: [
      { text: 'Обзор', link: '/level-2/' },
      { text: 'Терминология', link: '/level-2/terminology' },
      { text: 'Слои', link: '/level-2/layers' },
      { text: 'Домены', link: '/level-2/domains' },
      { text: 'Зависимости', link: '/level-2/dependencies' },
      { text: 'Проверка', link: '/level-2/validation' },
    ],
  },
  {
    text: 'Правила',
    items: [
      { text: 'Как устроены правила', link: '/rules/' },
      { text: 'Реестр Level 1', link: '/rules/level-1' },
      { text: 'Реестр Level 2', link: '/rules/level-2' },
    ],
  },
]

export default defineConfig({
  srcDir: '../DRAFT',
  srcExclude: ['README.md', 'level-3/**'],
  rewrites: {
    'level-1/README.md': 'level-1/index.md',
    'level-2/README.md': 'level-2/index.md',
    'rules/README.md': 'rules/index.md',
  },
  title: 'SLM Design',
  description: 'Последовательная архитектура фронтенд-приложений SLM',
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
      { text: 'Level 2', link: '/level-2/' },
      { text: 'Правила', link: '/rules/' },
    ],
    sidebar: documentationSidebar,
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
      quote: 'Запрошенная страница отсутствует в опубликованной документации SLM.',
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
      message: 'SLM Levels 1-2',
      copyright: 'Рабочий черновик архитектуры.',
    },
  },
})
