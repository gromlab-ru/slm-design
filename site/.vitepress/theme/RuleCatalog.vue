<script setup lang="ts">
import { computed, ref } from 'vue'
import { withBase } from 'vitepress'
import { data as rules } from '../rules.data.mts'

type Rule = (typeof rules)[number]

const query = ref('')
const ruleset = ref('ALL')
const area = ref('ALL')
const level = ref('ALL')
const copiedId = ref('')

const areas = [...new Set(rules.map((rule) => rule.area))].sort()
const levels = ['ОБЯЗАН', 'ЗАПРЕЩЕНО', 'СЛЕДУЕТ', 'МОЖЕТ']

function relevance(rule: Rule, normalizedQuery: string) {
  const id = rule.id.toLowerCase()
  if (id === normalizedQuery) return 0
  if (id.startsWith(normalizedQuery)) return 1
  if (id.includes(normalizedQuery)) return 2
  return 3
}

const filteredRules = computed(() => {
  const normalizedQuery = query.value.trim().toLowerCase()

  return rules
    .filter((rule) => ruleset.value === 'ALL' || rule.ruleset === ruleset.value)
    .filter((rule) => area.value === 'ALL' || rule.area === area.value)
    .filter((rule) => level.value === 'ALL' || rule.level === level.value)
    .filter((rule) => {
      if (!normalizedQuery) return true
      return `${rule.id} ${rule.text} ${rule.pageTitle} ${rule.sectionTitle}`
        .toLowerCase()
        .includes(normalizedQuery)
    })
    .sort((left, right) => relevance(left, normalizedQuery) - relevance(right, normalizedQuery))
})

async function copyRuleLink(rule: Rule) {
  const url = new URL(withBase(rule.href), window.location.origin).href
  await navigator.clipboard.writeText(url)
  copiedId.value = rule.id
  window.setTimeout(() => {
    if (copiedId.value === rule.id) copiedId.value = ''
  }, 1600)
}
</script>

<template>
  <div class="rule-catalog">
    <div class="rule-catalog__controls">
      <label class="rule-catalog__search">
        <span>Правило или текст</span>
        <input v-model="query" type="search" placeholder="SLM-BASE-FND-003" />
      </label>

      <label>
        <span>Rule set</span>
        <select v-model="ruleset">
          <option value="ALL">Все</option>
          <option value="BASE">Base</option>
          <option value="ADV">Advanced</option>
          <option value="PRO">Pro</option>
        </select>
      </label>

      <label>
        <span>Area</span>
        <select v-model="area">
          <option value="ALL">Все</option>
          <option v-for="item in areas" :key="item" :value="item">{{ item }}</option>
        </select>
      </label>

      <label>
        <span>Уровень</span>
        <select v-model="level">
          <option value="ALL">Все</option>
          <option v-for="item in levels" :key="item" :value="item">{{ item }}</option>
        </select>
      </label>
    </div>

    <div class="rule-catalog__summary" aria-live="polite">
      Найдено: <strong>{{ filteredRules.length }}</strong> из {{ rules.length }}
    </div>

    <div class="rule-catalog__list">
      <article v-for="rule in filteredRules" :key="rule.id" class="rule-catalog__item">
        <div class="rule-catalog__item-head">
          <a :href="withBase(rule.href)" class="rule-catalog__id">{{ rule.id }}</a>
          <div class="rule-catalog__badges">
            <span :class="`rule-catalog__badge rule-catalog__badge--${rule.ruleset.toLowerCase()}`">
              {{ rule.ruleset }}
            </span>
            <span class="rule-catalog__badge">{{ rule.area }}</span>
            <span class="rule-catalog__badge">{{ rule.level }}</span>
          </div>
        </div>

        <p>{{ rule.text }}</p>

        <div class="rule-catalog__source">
          <a :href="withBase(rule.href)">{{ rule.pageTitle }} · {{ rule.sectionTitle }}</a>
          <button type="button" @click="copyRuleLink(rule)">
            {{ copiedId === rule.id ? 'Скопировано' : 'Копировать ссылку' }}
          </button>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.rule-catalog {
  margin-top: 28px;
}

.rule-catalog__controls {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) repeat(3, minmax(120px, 0.35fr));
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg-soft);
}

.rule-catalog__controls label {
  display: grid;
  gap: 6px;
  color: var(--vp-c-text-2);
  font-size: 12px;
  font-weight: 650;
}

.rule-catalog__controls input,
.rule-catalog__controls select {
  width: 100%;
  min-height: 40px;
  padding: 8px 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  outline: none;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font: inherit;
  font-size: 14px;
}

.rule-catalog__controls input:focus,
.rule-catalog__controls select:focus {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 3px var(--vp-c-brand-soft);
}

.rule-catalog__summary {
  margin: 14px 2px;
  color: var(--vp-c-text-2);
  font-size: 13px;
}

.rule-catalog__list {
  display: grid;
  gap: 10px;
}

.rule-catalog__item {
  padding: 16px 18px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
}

.rule-catalog__item p {
  margin: 12px 0;
  color: var(--vp-c-text-1);
  line-height: 1.6;
}

.rule-catalog__item-head,
.rule-catalog__source,
.rule-catalog__badges {
  display: flex;
  align-items: center;
}

.rule-catalog__item-head,
.rule-catalog__source {
  justify-content: space-between;
  gap: 12px;
}

.rule-catalog__badges {
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}

.rule-catalog__id {
  color: var(--vp-c-brand-1);
  font-family: var(--vp-font-family-mono);
  font-size: 14px;
  font-weight: 700;
}

.rule-catalog__badge {
  padding: 3px 7px;
  border-radius: 4px;
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-2);
  font-family: var(--vp-font-family-mono);
  font-size: 10px;
  font-weight: 650;
}

.rule-catalog__badge--base {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.rule-catalog__source {
  color: var(--vp-c-text-3);
  font-size: 12px;
}

.rule-catalog__source a {
  color: inherit;
}

.rule-catalog__source button {
  flex: 0 0 auto;
  border: 0;
  background: transparent;
  color: var(--vp-c-brand-1);
  cursor: pointer;
  font: inherit;
}

@media (max-width: 820px) {
  .rule-catalog__controls {
    grid-template-columns: 1fr 1fr;
  }

  .rule-catalog__search {
    grid-column: 1 / -1;
  }
}

@media (max-width: 560px) {
  .rule-catalog__controls {
    grid-template-columns: 1fr;
  }

  .rule-catalog__search {
    grid-column: auto;
  }

  .rule-catalog__item-head,
  .rule-catalog__source {
    align-items: flex-start;
    flex-direction: column;
  }

  .rule-catalog__badges {
    justify-content: flex-start;
  }
}
</style>
