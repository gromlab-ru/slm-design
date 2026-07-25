import DefaultTheme from 'vitepress/theme'
import Layout from './Layout.vue'
import RuleCatalog from './RuleCatalog.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('RuleCatalog', RuleCatalog)
  },
}
