/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useMemo } from 'react'
import * as Yup from 'yup'
import { defaultTo, isEmpty, omit, isUndefined, noop } from 'lodash-es'
import {
  Button,
  Container,
  Formik,
  FormikForm,
  Layout,
  ButtonVariation,
  VisualYamlSelectedView as SelectedView
} from '@wings-software/uicore'
import { useHistory, useParams } from 'react-router-dom'
import cx from 'classnames'
import type { FormikErrors, FormikProps } from 'formik'
import type {
  PipelineInfoConfig,
  ResponsePMSPipelineResponseDTO,
  EntityGitDetails,
  ResponseInputSetTemplateWithReplacedExpressionsResponse
} from 'services/pipeline-ng'
import type { YamlBuilderHandlerBinding, YamlBuilderProps } from '@common/interfaces/YAMLBuilderProps'
import type { InputSetGitQueryParams, InputSetPathProps, PipelineType } from '@common/interfaces/RouteInterfaces'
import { NameIdDescriptionTags } from '@common/components'
import { StoreMetadata, StoreType } from '@common/constants/GitSyncTypes'
import { useStrings } from 'framework/strings'
import { GitSyncStoreProvider } from 'framework/GitRepoStore/GitSyncStoreContext'
import { usePermission } from '@rbac/hooks/usePermission'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { useQueryParams } from '@common/hooks'
import GitContextForm, { GitContextProps } from '@common/components/GitContextForm/GitContextForm'
import { IdentifierSchema, NameSchema } from '@common/utils/Validation'
import { GitSyncForm } from '@gitsync/components/GitSyncForm/GitSyncForm'
import type { InputSetDTO, InputSetType, Pipeline } from '@pipeline/utils/types'
import {
  isCloneCodebaseEnabledAtLeastOneStage,
  isCodebaseFieldsRuntimeInputs,
  getPipelineWithoutCodebaseInputs
} from '@pipeline/utils/CIUtils'
import { mergeTemplateWithInputSetData } from '@pipeline/utils/runPipelineUtils'
import { YamlBuilderMemo } from '@common/components/YAMLBuilder/YamlBuilder'
import { getYamlFileName } from '@pipeline/utils/yamlUtils'
import { parse } from '@common/utils/YamlHelperMethods'
import { PipelineInputSetForm } from '../PipelineInputSetForm/PipelineInputSetForm'
import { validatePipeline } from '../PipelineStudio/StepUtil'
import { factory } from '../PipelineSteps/Steps/__tests__/StepTestUtil'
import { ErrorsStrip } from '../ErrorsStrip/ErrorsStrip'
import { StepViewType } from '../AbstractSteps/Step'
import css from './InputSetForm.module.scss'

export const showPipelineInputSetForm = (
  resolvedTemplatesPipelineYaml: string | undefined,
  template: ResponseInputSetTemplateWithReplacedExpressionsResponse | null
): boolean => {
  return !!(
    resolvedTemplatesPipelineYaml &&
    template?.data?.inputSetTemplateYaml &&
    parse<Pipeline>(template.data.inputSetTemplateYaml)
  )
}

export const isYamlPresent = (
  template: ResponseInputSetTemplateWithReplacedExpressionsResponse | null,
  pipeline: ResponsePMSPipelineResponseDTO | null
): string | undefined => {
  return template?.data?.inputSetTemplateYaml && pipeline?.data?.yamlPipeline
}

type InputSetDTOGitDetails = InputSetDTO & GitContextProps & StoreMetadata
interface FormikInputSetFormProps {
  inputSet: InputSetDTO | InputSetType
  template: ResponseInputSetTemplateWithReplacedExpressionsResponse | null
  pipeline: ResponsePMSPipelineResponseDTO | null
  resolvedTemplatesPipelineYaml?: string
  handleSubmit: (
    inputSetObjWithGitInfo: InputSetDTO,
    gitDetails?: EntityGitDetails,
    storeMetadata?: StoreMetadata
  ) => Promise<void>
  formErrors: Record<string, unknown>
  setFormErrors: React.Dispatch<React.SetStateAction<Record<string, unknown>>>
  formikRef: React.MutableRefObject<FormikProps<InputSetDTOGitDetails> | undefined>
  selectedView: SelectedView
  executionView?: boolean
  isEdit: boolean
  isGitSyncEnabled?: boolean
  isGitSimplificationEnabled?: boolean
  yamlHandler?: YamlBuilderHandlerBinding
  setYamlHandler: React.Dispatch<React.SetStateAction<YamlBuilderHandlerBinding | undefined>>
  className?: string
  onCancel?: () => void
  filePath?: string
}

const yamlBuilderReadOnlyModeProps: YamlBuilderProps = {
  fileName: 'input-set.yaml',
  entityType: 'InputSets',
  width: 620,
  height: 360,
  showSnippetSection: false,
  yamlSanityConfig: {
    removeEmptyString: false,
    removeEmptyObject: false,
    removeEmptyArray: false
  }
}

function useValidateValues({
  template,
  pipeline,
  formErrors,
  setFormErrors,
  resolvedPipeline
}: {
  template: ResponseInputSetTemplateWithReplacedExpressionsResponse | null
  pipeline: ResponsePMSPipelineResponseDTO | null
  formErrors: Record<string, unknown>
  setFormErrors: React.Dispatch<React.SetStateAction<Record<string, unknown>>>
  resolvedPipeline?: PipelineInfoConfig
}): {
  validateValues: (values: InputSetDTO & GitContextProps & StoreMetadata) => Promise<FormikErrors<InputSetDTO>>
} {
  const { getString } = useStrings()
  const NameIdSchema = Yup.object({
    name: NameSchema(),
    identifier: IdentifierSchema()
  })
  return {
    validateValues: async (
      values: InputSetDTO & GitContextProps & StoreMetadata
    ): Promise<FormikErrors<InputSetDTO>> => {
      let errors: FormikErrors<InputSetDTO> = {}
      try {
        await NameIdSchema.validate(values)
      } catch (err) {
        if (err.name === 'ValidationError') {
          errors = { [err.path]: err.message }
        }
      }
      if (values.pipeline && isYamlPresent(template, pipeline)) {
        errors.pipeline = validatePipeline({
          pipeline: values.pipeline,
          template: parse<Pipeline>(defaultTo(template?.data?.inputSetTemplateYaml, '')).pipeline,
          originalPipeline: parse<Pipeline>(defaultTo(pipeline?.data?.yamlPipeline, '')).pipeline,
          getString,
          viewType: StepViewType.InputSet,
          viewTypeMetadata: { isInputSet: true },
          resolvedPipeline
        }) as any

        if (isEmpty(errors.pipeline)) {
          delete errors.pipeline
        }
      }

      if (!isEmpty(formErrors)) {
        setFormErrors(errors)
      }

      return errors
    }
  }
}

const onSubmitClick = (
  formikProps: FormikProps<InputSetDTO & GitContextProps & StoreMetadata>,
  setFormErrors: React.Dispatch<React.SetStateAction<Record<string, unknown>>>,
  handleSubmit: (
    inputSetObjWithGitInfo: InputSetDTO,
    gitDetails?: EntityGitDetails,
    storeMetadata?: StoreMetadata
  ) => Promise<void>
): void => {
  formikProps.validateForm().then(errors => {
    setFormErrors(errors)
    if (formikProps?.values.name?.length && formikProps?.values.identifier?.length && isEmpty(formikProps.errors)) {
      handleSubmit(
        formikProps.values,
        {
          repoIdentifier: formikProps.values.repo,
          branch: formikProps.values.branch,
          repoName: formikProps.values.repo
        },
        {
          connectorRef: formikProps.values.connectorRef,
          repoName: formikProps.values.repo,
          branch: formikProps.values.branch,
          filePath: formikProps.values.filePath,
          storeType: formikProps.values.storeType
        }
      )
    }
  })
}

export default function FormikInputSetForm(props: FormikInputSetFormProps): React.ReactElement {
  const {
    inputSet,
    template,
    pipeline,
    resolvedTemplatesPipelineYaml,
    handleSubmit,
    formErrors,
    setFormErrors,
    formikRef,
    selectedView,
    executionView,
    isEdit,
    isGitSyncEnabled,
    isGitSimplificationEnabled,
    yamlHandler,
    setYamlHandler,
    className,
    onCancel,
    filePath
  } = props
  const { getString } = useStrings()
  const { projectIdentifier, orgIdentifier, accountId, pipelineIdentifier } = useParams<
    PipelineType<InputSetPathProps> & { accountId: string }
  >()
  const { repoIdentifier, branch, connectorRef, storeType, repoName } = useQueryParams<InputSetGitQueryParams>()
  const history = useHistory()
  const resolvedPipeline = defaultTo(
    parse<Pipeline>(defaultTo(resolvedTemplatesPipelineYaml, ''))?.pipeline,
    {} as PipelineInfoConfig
  )

  useEffect(() => {
    if (!isUndefined(inputSet?.outdated) && yamlHandler?.setLatestYaml) {
      yamlHandler.setLatestYaml({
        inputSet: {
          ...omit(inputSet, 'gitDetails', 'entityValidityDetails', 'inputSetReferences', 'repo', 'branch', 'outdated')
        }
      })
    }
  }, [inputSet?.outdated])

  useEffect(() => {
    // only do this for CI
    if (
      formikRef.current?.values?.pipeline?.template &&
      isCodebaseFieldsRuntimeInputs(
        formikRef.current?.values.pipeline?.template?.templateInputs as PipelineInfoConfig
      ) &&
      resolvedPipeline &&
      !isCloneCodebaseEnabledAtLeastOneStage(resolvedPipeline)
    ) {
      const newPipeline = getPipelineWithoutCodebaseInputs(formikRef.current.values)
      formikRef.current.setFieldValue('pipeline', newPipeline)
    }
  }, [formikRef.current?.values?.pipeline?.template])

  const [isEditable] = usePermission(
    {
      resourceScope: {
        projectIdentifier,
        orgIdentifier,
        accountIdentifier: accountId
      },
      resource: {
        resourceType: ResourceType.PIPELINE,
        resourceIdentifier: pipelineIdentifier
      },
      permissions: [PermissionIdentifier.EDIT_PIPELINE],
      options: {
        skipCache: true
      }
    },
    [projectIdentifier, orgIdentifier, accountId, pipelineIdentifier]
  )

  const { validateValues } = useValidateValues({ template, pipeline, formErrors, setFormErrors, resolvedPipeline })

  const NameIdSchema = Yup.object({
    name: NameSchema(),
    identifier: IdentifierSchema()
  })
  const formRefDom = React.useRef<HTMLElement | undefined>()
  const init = React.useMemo(() => {
    const omittedPipeline = omit(inputSet, 'gitDetails', 'entityValidityDetails', 'outdated') as Pipeline
    return mergeTemplateWithInputSetData({
      templatePipeline: omittedPipeline,
      inputSetPortion: omittedPipeline,
      allValues: { pipeline: resolvedPipeline },
      shouldUseDefaultValues: !isEdit
    })
  }, [inputSet, isEdit, resolvedPipeline])
  const hasError = useMemo(() => {
    return formErrors && Object.keys(formErrors).length > 0
  }, [formErrors])

  const storeMetadata = {
    repo: isGitSyncEnabled ? defaultTo(repoIdentifier, '') : defaultTo(repoName, ''),
    branch: defaultTo(branch, ''),
    connectorRef: defaultTo(connectorRef, ''),
    repoName: defaultTo(repoName, ''),
    storeType: defaultTo(storeType, StoreType.INLINE),
    filePath: defaultTo(inputSet.gitDetails?.filePath, filePath)
  }

  const isPipelineRemote = isGitSimplificationEnabled && storeType === StoreType.REMOTE

  return (
    <Container className={cx(css.inputSetForm, className, hasError ? css.withError : '')}>
      <Layout.Vertical
        spacing="medium"
        ref={ref => {
          formRefDom.current = ref as HTMLElement
        }}
      >
        <Formik<InputSetDTO & GitContextProps & StoreMetadata>
          initialValues={{
            ...init,
            ...storeMetadata
          }}
          enableReinitialize={true}
          formName="inputSetForm"
          validationSchema={NameIdSchema}
          validate={validateValues}
          onSubmit={values => {
            handleSubmit(
              values,
              {
                repoIdentifier: values.repo,
                branch: values.branch,
                repoName: values.repo
              },
              {
                connectorRef: values.connectorRef,
                repoName: values.repo,
                branch: values.branch,
                filePath: values.filePath,
                storeType: values.storeType
              }
            )
          }}
        >
          {formikProps => {
            formikRef.current = formikProps
            return (
              <>
                {selectedView === SelectedView.VISUAL ? (
                  <div className={css.inputsetGrid}>
                    <div>
                      <ErrorsStrip formErrors={formErrors} domRef={formRefDom} />
                      <FormikForm>
                        {executionView ? null : (
                          <Layout.Vertical className={css.content} padding="xlarge">
                            <NameIdDescriptionTags
                              className={css.nameiddescription}
                              identifierProps={{
                                inputLabel: getString('name'),
                                isIdentifierEditable: !isEdit && isEditable,
                                inputGroupProps: {
                                  disabled: !isEditable
                                }
                              }}
                              descriptionProps={{ disabled: !isEditable }}
                              tagsProps={{
                                disabled: !isEditable
                              }}
                              formikProps={formikProps}
                            />
                            {isGitSyncEnabled && (
                              <GitSyncStoreProvider>
                                <GitContextForm
                                  formikProps={formikProps}
                                  gitDetails={
                                    isEdit
                                      ? { ...inputSet.gitDetails, getDefaultFromOtherRepo: true }
                                      : { repoIdentifier, branch, getDefaultFromOtherRepo: true }
                                  }
                                  className={css.gitContextForm}
                                />
                              </GitSyncStoreProvider>
                            )}
                            {isPipelineRemote && (
                              <Container className={css.gitRemoteDetailsForm}>
                                <GitSyncForm
                                  formikProps={formikProps as any}
                                  handleSubmit={noop}
                                  isEdit={isEdit}
                                  initialValues={storeMetadata}
                                  disableFields={
                                    !isEdit
                                      ? {
                                          connectorRef: true,
                                          repoName: true,
                                          branch: true,
                                          filePath: false
                                        }
                                      : {}
                                  }
                                ></GitSyncForm>
                              </Container>
                            )}
                            {showPipelineInputSetForm(resolvedTemplatesPipelineYaml, template) && (
                              <PipelineInputSetForm
                                path="pipeline"
                                readonly={!isEditable}
                                originalPipeline={
                                  parse<Pipeline>(defaultTo(resolvedTemplatesPipelineYaml, ''))?.pipeline
                                }
                                template={parse<Pipeline>(defaultTo(template?.data?.inputSetTemplateYaml, '')).pipeline}
                                viewType={StepViewType.InputSet}
                              />
                            )}
                          </Layout.Vertical>
                        )}
                        <Layout.Horizontal className={css.footer} padding="xlarge">
                          <Button
                            variation={ButtonVariation.PRIMARY}
                            type="submit"
                            onClick={e => {
                              e.preventDefault()
                              onSubmitClick(formikProps, setFormErrors, handleSubmit)
                            }}
                            text={getString('save')}
                            disabled={!isEditable}
                          />
                          &nbsp; &nbsp;
                          <Button
                            variation={ButtonVariation.TERTIARY}
                            onClick={onCancel || history.goBack}
                            text={getString('cancel')}
                          />
                        </Layout.Horizontal>
                      </FormikForm>
                    </div>
                  </div>
                ) : (
                  <div className={css.editor}>
                    <ErrorsStrip formErrors={formErrors} />
                    <Layout.Vertical className={css.content} padding="xlarge">
                      <YamlBuilderMemo
                        {...yamlBuilderReadOnlyModeProps}
                        existingJSON={{
                          inputSet: omit(
                            formikProps?.values,
                            'inputSetReferences',
                            'repo',
                            'branch',
                            'outdated',
                            'connectorRef',
                            'repoName',
                            'filePath',
                            'storeType'
                          )
                        }}
                        bind={setYamlHandler}
                        isReadOnlyMode={!isEditable}
                        invocationMap={factory.getInvocationMap()}
                        height="calc(100vh - 230px)"
                        width="calc(100vw - 350px)"
                        showSnippetSection={false}
                        isEditModeSupported={isEditable}
                        fileName={getYamlFileName({
                          isPipelineRemote,
                          filePath: inputSet?.gitDetails?.filePath,
                          defaultName: yamlBuilderReadOnlyModeProps.fileName
                        })}
                      />
                    </Layout.Vertical>
                    <Layout.Horizontal className={css.footer} padding="xlarge">
                      <Button
                        variation={ButtonVariation.PRIMARY}
                        type="submit"
                        disabled={!isEditable}
                        text={getString('save')}
                        onClick={() => {
                          const latestYaml = defaultTo(yamlHandler?.getLatestYaml(), '')
                          const inputSetDto: InputSetDTO = parse<{ inputSet: InputSetDTO }>(latestYaml)?.inputSet
                          const identifier = inputSetDto.identifier
                          const defaultFilePath = identifier ? `.harness/${identifier}.yaml` : ''

                          handleSubmit(
                            inputSetDto,
                            {
                              repoIdentifier: formikProps.values.repo,
                              branch: formikProps.values.branch
                            },
                            {
                              connectorRef: formikProps.values.connectorRef,
                              repoName: formikProps.values.repoName,
                              branch: formikProps.values.branch,
                              filePath: defaultTo(formikProps.values.filePath, defaultFilePath),
                              storeType: formikProps.values.storeType
                            }
                          )
                        }}
                      />
                      &nbsp; &nbsp;
                      <Button
                        variation={ButtonVariation.TERTIARY}
                        onClick={onCancel || history.goBack}
                        text={getString('cancel')}
                      />
                    </Layout.Horizontal>
                  </div>
                )}
              </>
            )
          }}
        </Formik>
      </Layout.Vertical>
    </Container>
  )
}
