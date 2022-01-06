import { defaultTo, get, isEmpty, set, unset } from 'lodash-es'
import type { StageElementConfig, StepElementConfig, TemplateLinkConfig } from 'services/cd-ng'
import type { TemplateSummaryResponse } from 'services/template-ng'
import { getIdentifierFromValue, getScopeFromDTO } from '@common/components/EntityReference/EntityReference'
import { Scope } from '@common/interfaces/SecretsInterface'
import type { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import type { TemplateStepNode } from 'services/pipeline-ng'
import type { StageType } from '@pipeline/utils/stageHelpers'

export const TEMPLATE_INPUT_PATH = 'template.templateInputs'

export const getTemplateNameWithLabel = (template?: TemplateSummaryResponse): string => {
  return `${(template as TemplateSummaryResponse)?.name} (${defaultTo(template?.versionLabel, 'Stable')})`
}

export const getScopeBasedTemplateRef = (template: TemplateSummaryResponse): string => {
  const templateIdentifier = defaultTo(template.identifier, '')
  const scope = getScopeFromDTO(template)
  return scope === Scope.PROJECT ? templateIdentifier : `${scope}.${templateIdentifier}`
}

export const getStageType = (stage?: StageElementConfig, templateTypes?: { [key: string]: string }): StageType => {
  return stage?.template
    ? templateTypes
      ? (get(templateTypes, getIdentifierFromValue(defaultTo(stage?.template?.templateRef, ''))) as StageType)
      : ((stage.template.templateInputs as StageElementConfig).type as StageType)
    : (stage?.type as StageType)
}

export const getStepType = (step?: StepElementConfig | TemplateStepNode): StepType => {
  const isTemplate = !!(step as TemplateStepNode)?.template
  return isTemplate
    ? (((step as TemplateStepNode)?.template?.templateInputs as StepElementConfig).type as StepType)
    : ((step as StepElementConfig)?.type as StepType)
}

export const setTemplateInputs = (
  data: TemplateStepNode | StageElementConfig,
  templateInputs: TemplateLinkConfig['templateInputs']
) => {
  if (isEmpty(templateInputs)) {
    unset(data, TEMPLATE_INPUT_PATH)
  } else {
    set(data, TEMPLATE_INPUT_PATH, templateInputs)
  }
}
