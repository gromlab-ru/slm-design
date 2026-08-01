import { ComponentRenderer } from 'infra/cms/component-renderer'
import { digitalPlatformApi } from '@biocadless/digital-platform-api'
import type { CmsPageEntryProps } from 'infra/cms/cms-page-entry-registry'

/**
 * Входная точка CMS-страницы {{name.pascalCase}}.
 *
 * Используется для:
 *  - загрузки дерева CMS-компонентов страницы
 *  - подключения страницы к dynamic CMS routing
 */
export const {{name.pascalCase}}PageEntry = async (props: CmsPageEntryProps) => {
  const { pageId } = props
  const components = await digitalPlatformApi.componentInstances.listV1({ pageId })

  return (
    <>
      {components.map((component) => (
        <ComponentRenderer key={component.id} data={component} />
      ))}
    </>
  )
}
