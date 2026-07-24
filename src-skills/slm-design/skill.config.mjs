export default {
  name: 'slm-design',
  description: 'Используй при определении архитектурной роли изменения и работе по SLM Design: выборе владельца кода, слоя, модуля, scope, public API, направления зависимостей и пути продуктовых данных. Триггеры: SLM, Scoped Layered Module Design, где разместить или перенести код, business factory, DomainApi, DomainDeps, compositions/business, dependency adapter, inline adapter в builder, прямой вызов API из page/screen/hook, Zustand/SWR/SDK внутри business, domain error, deep import, module vs component, ui vs parts, page-level provider/store, business graph, Partial<Business>, event bus, subscription cleanup, lifecycle, factory-level и assembly tests, архитектура template/scaffold, перенос между apps/*/src и packages/*. НЕ используй для форматирования уже размещённого React/TypeScript/CSS-кода, реализации REST/OpenAPI-клиента, Next.js routing/rendering или механики генерации шаблона без архитектурного выбора. В смешанной задаче сначала зафиксируй SLM-границу, затем применяй профильный skill.',
  source: 'SKILL.md',
  linkRewrites: [
    { from: './file-atlas.md', to: './reference/canons/file-atlas.md' },
    { from: './business-runtime-boundary.md', to: '#runtime-граница-business' },
    { from: './validation.md', to: '#архитектурная-проверка' },
    { from: './layers.md', to: './reference/canons/layers.md' },
    { from: './modules.md', to: './reference/canons/modules.md' },
    { from: './business-factory.md', to: './reference/canons/business-factory.md' },
    { from: './segments.md', to: './reference/canons/segments.md' },
    { from: './monorepo.md', to: './reference/canons/monorepo.md' },
    {
      from: '../examples/react/composition-provider.md',
      to: './reference/examples/react/composition-provider.md',
    },
    {
      from: '../examples/react/composition-structures.md',
      to: './reference/examples/react/composition-structures.md',
    },
    { from: '../examples/business-composition.md', to: './reference/examples/business-composition.md' },
    { from: '../examples/business-testing.md', to: './reference/examples/business-testing.md' },
  ],
};
