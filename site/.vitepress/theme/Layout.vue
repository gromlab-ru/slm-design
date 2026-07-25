<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import DocSetHeader from './DocSetHeader.vue'

const { Layout } = DefaultTheme
const { lang } = useData()

const bannerText = computed(() =>
  lang.value.startsWith('ru')
    ? 'SLM 2.0 DRAFT / Не заменяет действующую документацию'
    : 'SLM 2.0 DRAFT / Not the current stable documentation',
)
</script>

<template>
  <Layout>
    <template #layout-top>
      <div class="draft-banner">
        <span class="draft-banner__mark" aria-hidden="true" />
        {{ bannerText }}
      </div>
    </template>
    <template #sidebar-nav-before>
      <DocSetHeader />
    </template>
  </Layout>
</template>
