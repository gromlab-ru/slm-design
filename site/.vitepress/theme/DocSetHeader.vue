<script setup lang="ts">
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'

const { page } = useData()

const documentSet = computed(() => {
  if (page.value.relativePath.startsWith('ru/specification/')) {
    return {
      eyebrow: 'Нормативный документ',
      href: '/ru/specification/',
      meta: 'DRAFT · v0.1.0',
      title: 'SLM Design Specification',
    }
  }

  if (page.value.relativePath.startsWith('ru/guide/')) {
    return {
      eyebrow: 'Учебный материал',
      href: '/ru/guide/',
      meta: 'GUIDE',
      title: 'SLM Architecture Guide',
    }
  }

  return null
})
</script>

<template>
  <div v-if="documentSet" class="doc-set-header">
    <a class="doc-set-header__back" :href="withBase('/ru/')">Документация</a>
    <a class="doc-set-header__title" :href="withBase(documentSet.href)">
      {{ documentSet.title }}
    </a>
    <div class="doc-set-header__meta">
      <span>{{ documentSet.eyebrow }}</span>
      <span>{{ documentSet.meta }}</span>
    </div>
  </div>
</template>
