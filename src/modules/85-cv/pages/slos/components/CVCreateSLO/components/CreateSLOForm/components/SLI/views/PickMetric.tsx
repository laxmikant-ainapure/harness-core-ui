import React, { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import {
  Card,
  Container,
  FontVariation,
  Heading,
  FormInput,
  Layout,
  Text,
  Color,
  useToaster,
  SelectOption,
  Icon
} from '@wings-software/uicore'
import { useGetSloMetrics } from 'services/cv'
import { useStrings } from 'framework/strings'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { getErrorMessage } from '@cv/utils/CommonUtils'
import SLOTargetChart from '@cv/pages/slos/components/SLOTargetChart/SLOTargetChart'
import {
  getSLOMetricOptions,
  getComparatorSuffixLabelId,
  convertSLOFormDataToServiceLevelIndicatorDTO
} from '@cv/pages/slos/components/CVCreateSLO/CVCreateSLO.utils'
import {
  comparatorOptions,
  defaultOption,
  getSLIMetricOptions,
  getEventTypeOptions,
  getMissingDataTypeOptions
} from '@cv/pages/slos/components/CVCreateSLO/CVCreateSLO.constants'
import { SLOPanelProps, SLIMetricTypes, SLOFormFields } from '@cv/pages/slos/components/CVCreateSLO/CVCreateSLO.types'
import css from '@cv/pages/slos/components/CVCreateSLO/CVCreateSLO.module.scss'

const PickMetric: React.FC<Omit<SLOPanelProps, 'children'>> = ({ formikProps }) => {
  const { getString } = useStrings()
  const { showError } = useToaster()
  const { accountId, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps>()
  const {
    monitoredServiceRef,
    healthSourceRef,
    goodRequestMetric,
    validRequestMetric,
    SLIMetricType,
    objectiveComparator
  } = formikProps.values
  const isRatioBasedMetric = SLIMetricType === SLIMetricTypes.RATIO

  const {
    data: SLOMetricsData,
    loading: SLOMetricsLoading,
    error: SLOMetricsError,
    refetch: refetchSLOMetrics
  } = useGetSloMetrics({
    monitoredServiceIdentifier: monitoredServiceRef,
    healthSourceIdentifier: healthSourceRef,
    queryParams: {
      accountId,
      orgIdentifier,
      projectIdentifier
    },
    lazy: true
  })

  useEffect(() => {
    if (monitoredServiceRef && healthSourceRef) {
      refetchSLOMetrics()
    }
  }, [monitoredServiceRef, healthSourceRef, refetchSLOMetrics])

  useEffect(() => {
    if (SLOMetricsError) {
      showError(getErrorMessage(SLOMetricsError))
    }
  }, [SLOMetricsError, showError])

  const SLOMetricOptions = getSLOMetricOptions(SLOMetricsData?.resource)

  const activeGoodMetric: SelectOption = useMemo(
    () => SLOMetricOptions.find(metric => metric.value === goodRequestMetric) ?? defaultOption,
    [SLOMetricOptions, goodRequestMetric]
  )

  const activeValidMetric: SelectOption = useMemo(
    () => SLOMetricOptions.find(metric => metric.value === validRequestMetric) ?? defaultOption,
    [SLOMetricOptions, validRequestMetric]
  )

  return (
    <>
      <Heading level={2} font={{ variation: FontVariation.FORM_TITLE }} margin={{ top: 'xxlarge', bottom: 'xsmall' }}>
        {getString('cv.slos.pickMetricsSLI')}
      </Heading>
      <Card className={css.cardPickMetric}>
        <FormInput.RadioGroup
          name={SLOFormFields.SLI_METRIC_TYPE}
          radioGroup={{ inline: true }}
          items={getSLIMetricOptions(getString)}
        />
        <Layout.Horizontal spacing="xxlarge">
          <Container padding={{ right: 'xxlarge' }} border={{ right: true }}>
            {isRatioBasedMetric && (
              <Layout.Horizontal spacing="xlarge">
                <FormInput.Select
                  name={SLOFormFields.EVENT_TYPE}
                  label={getString('cv.slos.slis.ratioMetricType.eventType')}
                  items={getEventTypeOptions(getString)}
                  className={css.eventType}
                />
                <FormInput.Select
                  name={SLOFormFields.GOOD_REQUEST_METRIC}
                  label={getString('cv.slos.slis.ratioMetricType.goodRequestsMetrics')}
                  placeholder={SLOMetricsLoading ? getString('loading') : undefined}
                  disabled={!healthSourceRef}
                  items={SLOMetricOptions}
                  className={css.metricSelect}
                  value={activeGoodMetric}
                  onChange={metric => formikProps.setFieldValue(SLOFormFields.GOOD_REQUEST_METRIC, metric.value)}
                />
              </Layout.Horizontal>
            )}
            <FormInput.Select
              name={SLOFormFields.VALID_REQUEST_METRIC}
              label={getString('cv.slos.slis.ratioMetricType.validRequestsMetrics')}
              placeholder={SLOMetricsLoading ? getString('loading') : undefined}
              disabled={!healthSourceRef}
              items={SLOMetricOptions}
              className={css.metricSelect}
              value={activeValidMetric}
              onChange={metric => formikProps.setFieldValue(SLOFormFields.VALID_REQUEST_METRIC, metric.value)}
            />
            <FormInput.Text
              name={SLOFormFields.OBJECTIVE_VALUE}
              label={getString('cv.objectiveValue')}
              inputGroup={{
                type: 'number',
                min: 0,
                max: SLIMetricType === SLIMetricTypes.RATIO ? 100 : undefined,
                rightElement:
                  SLIMetricType === SLIMetricTypes.RATIO ? <Icon name="percentage" padding="small" /> : undefined
              }}
              className={css.objectiveValue}
            />
            <Layout.Horizontal
              flex={{ justifyContent: 'flex-start', alignItems: 'baseline' }}
              spacing="small"
              width={320}
            >
              <Text font={{ variation: FontVariation.BODY }} color={Color.GREY_600}>
                {getString('cv.SLIValueIsGoodIf')}
              </Text>
              <FormInput.Select
                name={SLOFormFields.OBJECTIVE_COMPARATOR}
                items={comparatorOptions}
                onChange={option => {
                  formikProps.setFieldValue(SLOFormFields.OBJECTIVE_COMPARATOR, option.value)
                }}
                className={css.comparatorOptions}
              />
              <Text font={{ variation: FontVariation.BODY }} color={Color.GREY_600}>
                {getString(getComparatorSuffixLabelId(objectiveComparator))}
              </Text>
            </Layout.Horizontal>
            <FormInput.Select
              name={SLOFormFields.SLI_MISSING_DATA_TYPE}
              label={getString('cv.SLIMissingDataType')}
              items={getMissingDataTypeOptions(getString)}
              className={css.metricSelect}
            />
          </Container>

          <Container height="inherit" width="100%" margin={{ left: 'xxlarge' }}>
            <SLOTargetChart
              monitoredServiceIdentifier={monitoredServiceRef}
              serviceLevelIndicator={convertSLOFormDataToServiceLevelIndicatorDTO(formikProps.values)}
              topLabel={
                <Text
                  font={{ variation: FontVariation.TINY_SEMI }}
                  color={Color.GREY_500}
                  padding={{ bottom: 'medium' }}
                >
                  {getString('cv.SLIRequestRatio')}
                </Text>
              }
              customChartOptions={{ chart: { height: isRatioBasedMetric ? 280 : 220 } }}
              debounceWait={2000}
            />
          </Container>
        </Layout.Horizontal>
      </Card>
    </>
  )
}

export default PickMetric
