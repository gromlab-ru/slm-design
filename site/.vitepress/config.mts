import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitepress'
import { slugifyHeading } from '../../scripts/lib/slugify-heading.mjs'

const repositoryUrl = 'https://github.com/gromlab-ru/slm-design'
const viteConfigPath = fileURLToPath(new URL('../vite.config.mts', import.meta.url))

const documentationSidebar = [
  {
    text: 'Архитектурная модель',
    items: [
      { text: 'Владение и структура', link: '/architecture/' },
      { text: 'Слои и группы', link: '/architecture/layers' },
      { text: 'Модули и границы', link: '/architecture/modules' },
      { text: 'Сегменты', link: '/architecture/segments' },
    ],
  },
  {
    text: 'Нормативная часть',
    items: [
      { text: 'Устройство правил', link: '/rules/' },
      { text: 'Реестр правил', link: '/rules/registry' },
    ],
  },
  {
    text: 'Справочные материалы',
    items: [
      { text: 'Терминология', link: '/reference/terminology' },
      { text: 'Проверка архитектуры', link: '/reference/validation' },
    ],
  },
]

export default defineConfig({
  srcDir: '../docs',
  rewrites: {
    'README.md': 'index.md',
    'architecture/README.md': 'architecture/index.md',
    'rules/README.md': 'rules/index.md',
  },
  title: 'SLM Design',
  description: 'Архитектура фронтенд-приложений с явным владением ответственностями',
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
      { text: 'Архитектура', link: '/architecture/' },
      { text: 'Правила', link: '/rules/' },
      { text: 'Проверка', link: '/reference/validation' },
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
            buttonText: 'Найти в SLM',
            buttonAriaLabel: 'Искать по архитектуре, терминам и правилам',
          },
          modal: {
            displayDetails: 'Показать контекст',
            resetButtonTitle: 'Очистить запрос',
            backButtonTitle: 'Закрыть',
            noResultsText: 'Совпадений нет',
            footer: {
              selectText: 'выбрать',
              navigateText: 'перейти',
              closeText: 'закрыть',
            },
          },
        },
      },
    },
    outline: { level: [2, 3], label: 'В этом разделе' },
    notFound: {
      code: '404',
      title: 'Такой страницы нет',
      quote: 'Этот путь не относится к текущей структуре документации.',
      linkLabel: 'Открыть главную страницу',
      linkText: 'К началу документации',
    },
    editLink: {
      pattern: `${repositoryUrl}/edit/master/docs/:path`,
      text: 'Уточнить документацию',
    },
    lastUpdated: {
      text: 'Последнее изменение',
      formatOptions: { dateStyle: 'medium' },
    },
    docFooter: {
      prev: 'Назад',
      next: 'Далее',
    },
    darkModeSwitchLabel: 'Оформление',
    lightModeSwitchTitle: 'Светлая тема',
    darkModeSwitchTitle: 'Тёмная тема',
    sidebarMenuLabel: 'Содержание',
    returnToTopLabel: 'Наверх',
    skipToContentLabel: 'Перейти к содержанию',
    footer: {
      message: 'Документация SLM Design',
      copyright: 'Открытая архитектурная модель',
    },
  },
})
