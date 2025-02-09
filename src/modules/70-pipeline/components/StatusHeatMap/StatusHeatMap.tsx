/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { Color, Icon, IconName, Popover, PopoverProps } from '@harness/uicore'
import cx from 'classnames'
import React from 'react'
import { Link } from 'react-router-dom'
import {
  ExecutionStatus,
  isExecutionCompletedWithBadState,
  isExecutionPaused,
  isExecutionPausing,
  isExecutionRunning,
  isExecutionSuccess,
  isExecutionWaiting
} from '@pipeline/utils/statusHelpers'
import css from './StatusHeatMap.module.scss'

export const getStatusMapping = (status: ExecutionStatus) => {
  // ['Skipped,Queued,Discontinuing,NotStarted'] or any other unknown status will default to this
  const colorMap = {
    primaryState: 'default',
    icon: '' as IconName | '',
    iconColor: ''
  }
  if (isExecutionSuccess(status)) {
    colorMap.primaryState = 'success'
  } else if (isExecutionCompletedWithBadState(status)) {
    colorMap.primaryState = 'failed'
    colorMap.icon = 'cross'
    colorMap.iconColor = Color.RED_500
  } else if (isExecutionPaused(status) || isExecutionPausing(status) || isExecutionWaiting(status)) {
    colorMap.primaryState = 'paused'
    colorMap.icon = 'pause'
    colorMap.iconColor = Color.ORANGE_500
  } else if (isExecutionRunning(status)) {
    colorMap.primaryState = 'running'
    colorMap.icon = 'spinner'
    colorMap.iconColor = Color.PRIMARY_7
  }
  return colorMap
}

export interface StatusHeatMapProps<T> {
  data: T[]
  getId: (item: T, index: string) => string
  getStatus: (item: T) => ExecutionStatus
  getRouteTo?: (item: T) => string | undefined
  className?: string
  getPopoverProps?: (item: T) => PopoverProps
  onClick?: (item: T, event: React.MouseEvent) => void
  href?: string
}

export interface StatusCell<T> {
  row: T
  id: string
}

export function StatusHeatMap<T>(props: StatusHeatMapProps<T>): React.ReactElement {
  const { data, getId, getStatus, className, getPopoverProps, onClick, getRouteTo } = props

  function StatusCell({ row, id }: StatusCell<T>) {
    const { iconColor, icon, primaryState } = getStatusMapping(getStatus(row))
    return (
      <div
        data-id={getId(row, id)}
        data-primary-state={primaryState}
        className={css.statusHeatMapCell}
        onClick={e => onClick?.(row, e)}
      >
        {icon && <Icon name={icon} size={12} color={iconColor} />}
      </div>
    )
  }

  return (
    <div className={cx(css.statusHeatMap, className)}>
      {data.map((row, index) => {
        const id = getId(row, index.toString())
        const href = getRouteTo && getRouteTo(row)
        return (
          <Popover disabled={!getPopoverProps} key={id} {...getPopoverProps?.(row)}>
            {href ? (
              <Link to={href}>
                <StatusCell row={row} id={id} />
              </Link>
            ) : (
              <StatusCell row={row} id={id} />
            )}
          </Popover>
        )
      })}
    </div>
  )
}
