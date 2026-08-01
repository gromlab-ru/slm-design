export { useSimpleRestApiCache } from './cache'
export { createSimpleAuthSessionRequest } from './auth-session-request'
export { simpleHttpClient } from './client'
export { readSimpleApiFailure } from './errors'
export type {
  SimpleCategoryDto,
  SimpleOrderDto,
  SimpleProductDto,
  SimpleUserDto
} from './generated'
export * from './hooks'
export {
  DEMO_SCENARIOS,
  getDemoFixtureChange,
  getDemoScenario,
  getServerDemoFixtureChange,
  getServerDemoScenario,
  publishDemoFixtureChange,
  setDemoScenario,
  subscribeDemoFixtureChange,
  subscribeDemoScenario
} from './request-context'
export { simpleRestApi } from './rest-api'
export { SimpleRestApiProvider } from './simple-rest-api.provider'
export type { DemoScenario, SimpleOrdersQuery, SimpleProductsQuery } from './types'
