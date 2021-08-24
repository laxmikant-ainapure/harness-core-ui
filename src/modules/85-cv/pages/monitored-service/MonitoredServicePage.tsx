import React, { useEffect } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { Container, Tab, Tabs } from '@wings-software/uicore'
import routes from '@common/RouteDefinitions'
import { useStrings } from 'framework/strings'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { BGColorWrapper, HorizontalLayout } from '@cv/pages/health-source/common/StyledComponents'
import { useGetMonitoredService } from 'services/cv'
import { PageSpinner } from '@common/components'
import { getErrorMessage } from '@cv/utils/CommonUtils'
import { PageError } from '@common/components/Page/PageError'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import Configurations from './components/Configurations/Configurations'
import { MonitoringServicesHeader } from './monitoredService.styled'
import ServiceHealth from './components/ServiceHealth/ServiceHealth'
import EditHeader from './components/EditHeader/EditHeader'
import { MonitoredServiceEnum } from './MonitoredServicePage.constants'
import css from './MonitoredServicePage.module.scss'

function MonitoredServicePage(): JSX.Element {
  const { getString } = useStrings()
  const { selectedProject } = useAppStore()
  const project = selectedProject
  const { orgIdentifier, projectIdentifier, accountId, identifier } = useParams<
    ProjectPathProps & { identifier: string }
  >()

  const { state } = useLocation()

  const isEdit = !!identifier

  const {
    data: monitoredServiceData,
    refetch,
    loading,
    error
  } = useGetMonitoredService({
    lazy: true,
    identifier,
    pathParams: {
      identifier
    },
    queryParams: {
      orgIdentifier,
      projectIdentifier,
      accountId
    }
  })

  useEffect(() => {
    if (isEdit) {
      refetch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit])

  if (loading) return <PageSpinner />

  if (error) {
    return <PageError message={getErrorMessage(error)} onClick={() => refetch()} />
  }

  return (
    <BGColorWrapper>
      <MonitoringServicesHeader height={'80px'}>
        <HorizontalLayout alignItem={'flex-end'}>
          <NGBreadcrumbs
            links={[
              {
                url: routes.toCVProjectOverview({
                  orgIdentifier: orgIdentifier,
                  projectIdentifier: projectIdentifier,
                  accountId: accountId
                }),
                label: project?.name as string
              },
              {
                url: routes.toCVMonitoringServices({
                  orgIdentifier: orgIdentifier,
                  projectIdentifier: projectIdentifier,
                  accountId: accountId
                }),
                label: getString('cv.monitoredServices.title')
              }
            ]}
          />
        </HorizontalLayout>
        {isEdit ? (
          <EditHeader
            monitoredServiceData={monitoredServiceData?.data?.monitoredService}
            lastModifiedAt={monitoredServiceData?.data?.lastModifiedAt}
          />
        ) : (
          <p>{getString('cv.monitoredServices.addNewMonitoredServices')}</p>
        )}
      </MonitoringServicesHeader>
      {isEdit ? (
        <Container className={css.monitoredServiceTabs}>
          <Tabs id="monitoredServiceTabs" defaultSelectedTabId={MonitoredServiceEnum.ServiceHealth}>
            <Tab
              id={MonitoredServiceEnum.ServiceHealth}
              title={getString('cv.monitoredServices.monitoredServiceTabs.serviceHealth')}
              panel={<ServiceHealth currentHealthScore={(state as any)?.currentHealthScore} />}
            />
            <Tab
              id={MonitoredServiceEnum.SLOs}
              title={getString('cv.monitoredServices.monitoredServiceTabs.slos')}
              disabled
            />
            <Tab
              id={MonitoredServiceEnum.Configurations}
              title={getString('cv.monitoredServices.monitoredServiceTabs.configurations')}
              panel={<Configurations />}
            />
          </Tabs>
        </Container>
      ) : (
        <Configurations />
      )}
    </BGColorWrapper>
  )
}

export default MonitoredServicePage
