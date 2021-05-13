import { useState, useRef } from 'react'
import { isNil } from 'lodash-es'
import debounce from 'p-debounce'

import { validateJSONWithSchema } from '@common/utils/YamlUtils'
import { useDeepCompareEffect } from '@common/hooks'
import type { PipelineInfoConfig, ResponseJsonNode } from 'services/cd-ng'

import { usePipelineContext } from '../PipelineContext/PipelineContext'
import { usePipelineSchema } from '../PipelineSchema/PipelineSchemaContext'

export function useValidationErrors(): { errorMap: Map<string, string[]> } {
  const { pipelineSchema } = usePipelineSchema()
  const {
    state: { pipeline: originalPipeline }
  } = usePipelineContext()

  const [errorMap, setErrorMap] = useState<Map<string, string[]>>(new Map())
  const validateErrors = useRef(
    debounce(async (_originalPipeline: PipelineInfoConfig, _pipelineSchema: ResponseJsonNode | null): Promise<void> => {
      if (!isNil(_pipelineSchema) && _pipelineSchema.data) {
        const error = await validateJSONWithSchema({ pipeline: _originalPipeline }, _pipelineSchema.data)
        setErrorMap(error)
      }
    }, 300)
  )

  useDeepCompareEffect(() => {
    validateErrors.current(originalPipeline, pipelineSchema)
  }, [originalPipeline, pipelineSchema])

  return { errorMap }
}
