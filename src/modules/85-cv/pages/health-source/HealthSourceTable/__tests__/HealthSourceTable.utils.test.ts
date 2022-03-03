/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { ChangeSourceDTO } from 'services/cv'
import type { RowData } from '../../HealthSourceDrawer/HealthSourceDrawerContent.types'
import { deleteHealthSource, getIconBySourceType } from '../HealthSourceTable.utils'
import {
  selectedRow,
  changeSource,
  tableData,
  onDleteWithChangeSource,
  onDeleteWithOutChangeSource
} from './HealthSourceTable.mock'

describe('Validate Healthsource table Utils', () => {
  test('should validate deleteHealthSource', () => {
    // Delet healthsource when we have one change source
    expect(
      deleteHealthSource(selectedRow as RowData, changeSource as ChangeSourceDTO[], tableData as RowData[])
    ).toEqual(onDleteWithChangeSource)

    // Delet healthsource when we have no change source
    expect(deleteHealthSource(selectedRow as RowData, [] as ChangeSourceDTO[], tableData as RowData[])).toEqual(
      onDeleteWithOutChangeSource
    )
  })

  test('Ensure correct logo is returned by getIconBySourceType', async () => {
    expect(getIconBySourceType('CustomHealth')).toEqual('service-custom-connector')
    expect(getIconBySourceType('CUSTOM_HEALTH')).toEqual('service-custom-connector')
    expect(getIconBySourceType('DATADOG_LOG')).toEqual('service-datadog')
    expect(getIconBySourceType('DATADOG_METRICS')).toEqual('service-datadog')
    expect(getIconBySourceType('STACKDRIVER_LOG')).toEqual('service-stackdriver')
    expect(getIconBySourceType('DYNATRACE')).toEqual('service-dynatrace')
    expect(getIconBySourceType('Dynatrace')).toEqual('service-dynatrace')
  })
})
