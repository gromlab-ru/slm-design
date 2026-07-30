<script setup lang="ts">
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'

const { page } = useData()

const documentSet = computed(() => {
  if (page.value.relativePath.startsWith('level-1/')) {
    return {
      eyebrow: 'Архитектурная документация',
      href: '/level-1/',
      meta: 'LEVEL 1 · DRAFT',
      title: 'SLM Level 1',
    }
  }

  if (page.value.relativePath.startsWith('rules/')) {
    return {
      eyebrow: 'Канонический реестр',
      href: '/rules/level-1',
      meta: '14 RULES · DRAFT',
      title: 'Правила SLM',
    }
  }

  return null
})
</script>

