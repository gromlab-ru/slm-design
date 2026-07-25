import { defineConfig } from 'vitepress'
import type MarkdownIt from 'markdown-it'
import { fileURLToPath } from 'node:url'
import { splitSearchSections } from './search.mts'
import { RULE_SEARCH_OPTIONS } from '../../scripts/lib/specification.mjs'

const repositoryUrl = 'https://github.com/gromlab-ru/slm-design'
const viteConfigPath = fileURLToPath(new URL('../vite.config.mts', import.meta.url))

const specificationSidebar = [
  {
    text: 'Начало',
    items: [
      { text: 'Обзор спецификации', link: '/ru/specification/' },
      { text: 'Architecture modes', link: '/ru/specification/architecture-modes' },
      { text: 'Реестр правил', link: '/ru/specification/rules' },
    ],
  },
  {
    text: 'Base SLM',
    collapsed: false,
    items: [
      {
        text: 'Основы',
        items: [
          { text: 'Основные инварианты', link: '/ru/specification/foundations' },
          { text: 'Терминология', link: '/ru/specification/terminology' },
          { text: 'Архитектурная модель', link: '/ru/specification/architecture-model' },
        ],
      },
      {
        text: 'Слои',
        collapsed: true,
        items: [
          { text: 'Обзор', link: '/ru/specification/layers/' },
          { text: 'App', link: '/ru/specification/layers/app' },
          { text: 'Compositions', link: '/ru/specification/layers/compositions' },
          { text: 'Infra', link: '/ru/specification/layers/infra' },
          { text: 'UI', link: '/ru/specification/layers/ui' },
          { text: 'Shared', link: '/ru/specification/layers/shared' },
        ],
      },
      {
        text: 'Общие правила',
        collapsed: true,
        items: [
          { text: 'Модули и группы', link: '/ru/specification/modules-and-groups' },
          { text: 'Сегменты', link: '/ru/specification/segments' },
          { text: 'Public API и импорты', link: '/ru/specification/public-api-and-imports' },
          { text: 'State и data', link: '/ru/specification/state-and-data' },
          { text: 'Runtime и lifecycle', link: '/ru/specification/runtime-and-lifecycle' },
          { text: 'Тестирование', link: '/ru/specification/testing-and-conformance' },
          { text: 'Монорепозитории', link: '/ru/specification/monorepo' },
        ],
      },
    ],
  },
  {
    text: 'Overlays',
    collapsed: false,
    items: [
      {
        text: 'SLM Advanced',
        collapsed: true,
        items: [
          { text: 'Advanced overlay', link: '/ru/specification/modes/advanced/' },
          { text: 'Domains', link: '/ru/specification/modes/advanced/domains' },
        ],
      },
      {
        text: 'SLM Pro',
        collapsed: true,
        items: [
          { text: 'Pro overlay', link: '/ru/specification/modes/pro/' },
          { text: 'Domains', link: '/ru/specification/modes/pro/domains/' },
          { text: 'Business', link: '/ru/specification/modes/pro/domains/business' },
          { text: 'Framework surface', link: '/ru/specification/modes/pro/domains/framework' },
          { text: 'Ports и adapters', link: '/ru/specification/modes/pro/domains/ports-and-adapters' },
          { text: 'Client и server', link: '/ru/specification/modes/pro/domains/client-and-server' },
          { text: 'Cross-domain boundary', link: '/ru/specification/modes/pro/domains/cross-domain-boundary' },
          { text: 'Тестирование domains', link: '/ru/specification/modes/pro/domains/testing' },
        ],
      },
    ],
  },
]

function addRuleAnchors(md: MarkdownIt) {
  const rulePattern = /^\*\*(SLM-(?:BASE|ADV|PRO)-[A-Z][A-Z-]*-\d{3}) - (ОБЯЗАН|ЗАПРЕЩЕНО|СЛЕДУЕТ|МОЖЕТ)\.\*\*/
  const kindByKeyword: Record<string, string> = {
    ОБЯЗАН: 'required',
    ЗАПРЕЩЕНО: 'prohibited',
    СЛЕДУЕТ: 'recommended',
    МОЖЕТ: 'optional',
  }

  md.core.ruler.after('inline', 'slm-rule-anchors', (state) => {
    for (let index = 0; index < state.tokens.length - 1; index += 1) {
      const paragraph = state.tokens[index]
      const content = state.tokens[index + 1]

      if (paragraph.type !== 'paragraph_open' || content.type !== 'inline') continue

      const match = content.content.match(rulePattern)
      if (!match) continue

      paragraph.attrSet('id', match[1].toLowerCase())
      paragraph.attrJoin('class', 'slm-rule')
      paragraph.attrJoin('class', `slm-rule--${kindByKeyword[match[2]]}`)

      const strongCloseIndex = content.children?.findIndex((token) => token.type === 'strong_close') ?? -1
      if (strongCloseIndex < 0 || !content.children) continue

      const permalinkOpen = new state.Token('link_open', 'a', 1)
      permalinkOpen.attrSet('class', 'slm-rule__permalink')
      permalinkOpen.attrSet('href', `#${match[1].toLowerCase()}`)
      permalinkOpen.attrSet('aria-label', `Ссылка на правило ${match[1]}`)
      permalinkOpen.attrSet('title', `Ссылка на ${match[1]}`)

      const permalinkText = new state.Token('text', '', 0)
      permalinkText.content = '#'

      const permalinkClose = new state.Token('link_close', 'a', -1)
      content.children.splice(
        strongCloseIndex + 1,
        0,
        permalinkOpen,
        permalinkText,
        permalinkClose,
      )
    }
  })
}

export default defineConfig({
  srcDir: '../docs',
  title: 'SLM Design',
  description: 'Specification for explicit architecture boundaries in product applications',
  lang: 'en-US',
  base: '/slm-design/',
  cleanUrls: true,
  lastUpdated: true,
  sitemap: {
    hostname: 'https://gromlab-ru.github.io/slm-design/',
    transformItems: (items) => items.map((item) => {
      if (!item.links?.some((link) => link.url === 'ru/')) return item

      return {
        ...item,
        links: [
          { lang: 'x-default', url: '' },
          ...item.links.filter((link) => link.url !== ''),
        ],
      }
    }),
  },
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/slm-design/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#d97706' }],
  ],
  markdown: {
    config: addRuleAnchors,
  },
  vite: {
    configFile: viteConfigPath,
  },
  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'SLM Design',
    i18nRouting: false,
    nav: [
      { text: 'Русская спецификация', link: '/ru/' },
      { text: 'English', link: '/en/' },
    ],
    socialLinks: [{ icon: 'github', link: repositoryUrl }],
    search: {
      provider: 'local',
      options: {
        detailedView: false,
        disableQueryPersistence: true,
        miniSearch: {
          searchOptions: RULE_SEARCH_OPTIONS,
          _splitIntoSections: splitSearchSections,
        },
        locales: {
          ru: {
            translations: {
              button: {
                buttonText: 'Поиск или rule ID',
                buttonAriaLabel: 'Поиск по документации или rule ID',
              },
              modal: {
                displayDetails: 'Показать подробности',
                resetButtonTitle: 'Сбросить поиск',
                backButtonTitle: 'Закрыть поиск',
                noResultsText: 'Ничего не найдено по запросу',
                footer: {
                  selectText: 'выбрать',
                  navigateText: 'перейти',
                  closeText: 'закрыть',
                },
              },
            },
          },
        },
      },
    },
  },
  locales: {
    ru: {
      label: 'Русский',
      lang: 'ru-RU',
      link: '/ru/',
      title: 'SLM Design',
      description: 'Спецификация архитектурных границ продуктовых приложений',
      themeConfig: {
        nav: [
          { text: 'Документация', link: '/ru/' },
          { text: 'Спецификация', link: '/ru/specification/' },
        ],
        sidebar: {
          '/ru/specification/': specificationSidebar,
        },
        outline: { level: [2, 3], label: 'На этой странице' },
        editLink: {
          pattern: `${repositoryUrl}/edit/master/docs/:path`,
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
        langMenuLabel: 'Изменить язык',
        skipToContentLabel: 'Перейти к содержанию',
        footer: {
          message: 'SLM Design 2.0 Draft',
          copyright: 'Нормативная русская версия находится в статусе draft.',
        },
      },
    },
    en: {
      label: 'English',
      lang: 'en-US',
      link: '/en/',
      title: 'SLM Design',
      description: 'English translation placeholder for the SLM Design specification',
      themeConfig: {
        nav: [
          { text: 'English status', link: '/en/' },
          { text: 'Russian specification', link: '/ru/specification/' },
        ],
        outline: { level: [2, 3], label: 'On this page' },
        footer: {
          message: 'SLM Design 2.0 Draft',
          copyright: 'The English edition is not normative yet.',
        },
      },
    },
  },
})
