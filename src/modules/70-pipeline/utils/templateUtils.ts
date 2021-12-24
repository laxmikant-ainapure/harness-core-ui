import { defaultTo } from 'lodash-es'
import type { TemplateLinkConfig } from 'services/cd-ng'
import type { TemplateConfig } from '@pipeline/utils/tempates'

export const getTemplateNameWithLabel = (template?: TemplateLinkConfig | TemplateConfig) => {
  return `${template?.templateRef} (${defaultTo(template?.versionLabel, 'Stable')})`
}
