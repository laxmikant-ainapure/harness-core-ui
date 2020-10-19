import { Button, Color, Icon, IconName, Layout, Popover, Text } from '@wings-software/uikit'
import React from 'react'
import type { CellProps, Column, Renderer } from 'react-table'
import { useParams } from 'react-router-dom'
import { Classes, Menu, Position } from '@blueprintjs/core'
import Table from 'modules/common/components/Table/Table'
import { PageInputSetSummaryResponse, useDeleteInputSetForPipeline, InputSetSummaryResponse } from 'services/cd-ng'
import { useConfirmationDialog, useToaster } from 'modules/common/exports'
import { RunPipelineModal } from 'modules/cd/components/RunPipelineModal/RunPipelineModal'
import i18n from './InputSetList.i18n'
import css from './InputSetList.module.scss'

interface InputSetListViewProps {
  data?: PageInputSetSummaryResponse
  goToInputSetDetail?: (identifier?: string, type?: InputSetSummaryResponse['inputSetType']) => void
  cloneInputSet?: (identifier?: string) => void
  refetchInputSet?: () => void
  gotoPage: (pageNumber: number) => void
}

interface InputSetLocal extends InputSetSummaryResponse {
  action?: string
  lastUpdatedBy?: string
  createdBy?: string
  inputFieldSummary?: string
}

type CustomColumn<T extends object> = Column<T> & {
  goToInputSetDetail?: (identifier?: string) => void
  cloneInputSet?: (identifier?: string) => void
  refetchInputSet?: () => void
}

const getIconByType = (type: InputSetSummaryResponse['inputSetType']): IconName => {
  return type === 'OVERLAY_INPUT_SET' ? 'step-group' : 'yaml-builder-input-sets'
}

const RenderColumnInputSet: Renderer<CellProps<InputSetLocal>> = ({ row }) => {
  const data = row.original
  return (
    <Layout.Horizontal spacing="small">
      <Icon
        name={getIconByType(data.inputSetType)}
        color={data.inputSetType === 'INPUT_SET' ? Color.BLACK : Color.BLUE_500}
        size={30}
      ></Icon>
      <div>
        <Text color={Color.BLACK}>{data.name}</Text>
        <Text color={Color.GREY_400}>{data.identifier}</Text>
      </div>
    </Layout.Horizontal>
  )
}

const RenderColumnDescription: Renderer<CellProps<InputSetLocal>> = ({ row }) => {
  const data = row.original
  return (
    <Text lineClamp={2} color={Color.GREY_400}>
      {data.description}
    </Text>
  )
}
const RenderColumnActions: Renderer<CellProps<InputSetLocal>> = ({ row }) => {
  const data = row.original
  return (
    <RunPipelineModal
      pipelineIdentifier={data.pipelineIdentifier || /* istanbul ignore next */ ''}
      inputSetSelected={[
        {
          type: data.inputSetType || /* istanbul ignore next */ 'INPUT_SET',
          value: data.identifier || /* istanbul ignore next */ '',
          label: data.name || /* istanbul ignore next */ ''
        }
      ]}
    >
      <Button minimal intent="primary">
        {i18n.runPipeline}
      </Button>
    </RunPipelineModal>
  )
}
const RenderColumnMenu: Renderer<CellProps<InputSetLocal>> = ({ row, column }) => {
  const data = row.original
  const [menuOpen, setMenuOpen] = React.useState(false)
  const { showSuccess, showError } = useToaster()
  const { projectIdentifier, orgIdentifier, accountId, pipelineIdentifier } = useParams<{
    projectIdentifier: string
    orgIdentifier: string
    accountId: string
    pipelineIdentifier: string
  }>()
  const { mutate: deleteInputSet } = useDeleteInputSetForPipeline({
    queryParams: { accountIdentifier: accountId, orgIdentifier, projectIdentifier, pipelineIdentifier }
  })

  const { openDialog: confirmDelete } = useConfirmationDialog({
    contentText: i18n.confirmDelete(
      data.name || /* istanbul ignore next */ '',
      data.inputSetType === 'OVERLAY_INPUT_SET' ? i18n.overlayInputSet : i18n.inputSet
    ),
    titleText: i18n.confirmDeleteTitle(
      data.inputSetType === 'OVERLAY_INPUT_SET' ? i18n.overlayInputSet : i18n.inputSet
    ),
    confirmButtonText: i18n.deleteButton,
    cancelButtonText: i18n.cancel,
    onCloseDialog: async (isConfirmed: boolean) => {
      /* istanbul ignore else */
      if (isConfirmed) {
        try {
          const deleted = await deleteInputSet(data.identifier || /* istanbul ignore next */ '', {
            headers: { 'content-type': 'application/json' }
          })
          /* istanbul ignore else */
          if (deleted.status === 'SUCCESS') {
            showSuccess(i18n.inputSetDeleted(data.name || /* istanbul ignore next */ ''))
          }
          ;(column as any).refetchInputSet?.()
        } catch (err) {
          /* istanbul ignore next */
          showError(err?.data?.message)
        }
      }
    }
  })
  return (
    <Layout.Horizontal style={{ justifyContent: 'flex-end' }}>
      <Popover
        isOpen={menuOpen}
        onInteraction={nextOpenState => {
          setMenuOpen(nextOpenState)
        }}
        className={Classes.DARK}
        position={Position.BOTTOM_RIGHT}
      >
        <Button
          minimal
          className={css.actionButton}
          icon="more"
          onClick={e => {
            e.stopPropagation()
            setMenuOpen(true)
          }}
        />
        <Menu style={{ minWidth: 'unset' }}>
          <Menu.Item
            icon="edit"
            text={i18n.edit}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation()
              ;(column as any).goToInputSetDetail?.(data.identifier, data.inputSetType)
              setMenuOpen(false)
            }}
          />
          <Menu.Item
            icon="duplicate"
            disabled
            text={i18n.clone}
            onClick={
              /* istanbul ignore next */
              (e: React.MouseEvent) => {
                e.stopPropagation()
                ;(column as any).cloneInputSet?.(data.identifier)
                setMenuOpen(false)
              }
            }
          />
          <Menu.Divider />
          <Menu.Item
            icon="trash"
            text={i18n.delete}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation()
              confirmDelete()
              setMenuOpen(false)
            }}
          />
        </Menu>
      </Popover>
    </Layout.Horizontal>
  )
}

export const InputSetListView: React.FC<InputSetListViewProps> = ({
  data,
  gotoPage,
  goToInputSetDetail,
  refetchInputSet,
  cloneInputSet
}): JSX.Element => {
  const columns: CustomColumn<InputSetLocal>[] = React.useMemo(
    () => [
      {
        Header: i18n.inputSet.toUpperCase(),
        accessor: 'name',
        width: '25%',
        Cell: RenderColumnInputSet
      },
      {
        Header: i18n.description.toUpperCase(),
        accessor: 'description',
        width: '25%',
        Cell: RenderColumnDescription,
        disableSortBy: true
      },
      {
        Header: i18n.inputFieldSummary.toUpperCase(),
        accessor: 'inputFieldSummary',
        width: '15%',
        disableSortBy: true
      },
      {
        Header: i18n.lastUpdatedBy.toUpperCase(),
        accessor: 'lastUpdatedBy',
        width: '10%',
        disableSortBy: true
      },
      {
        Header: i18n.createdBy.toUpperCase(),
        accessor: 'createdBy',
        width: '10%',
        disableSortBy: true
      },
      {
        Header: i18n.actions.toUpperCase(),
        accessor: 'identifier',
        width: '10%',
        Cell: RenderColumnActions,
        disableSortBy: true,
        goToInputSetDetail
      },
      {
        Header: '',
        accessor: 'action',
        width: '5%',
        Cell: RenderColumnMenu,
        disableSortBy: true,
        goToInputSetDetail,
        refetchInputSet,
        cloneInputSet
      }
    ],
    [goToInputSetDetail, refetchInputSet, cloneInputSet]
  )
  return (
    <Table<InputSetLocal>
      className={css.table}
      columns={columns}
      data={data?.content || /* istanbul ignore next */ []}
      onRowClick={item => goToInputSetDetail?.(item.identifier, item.inputSetType)}
      pagination={{
        itemCount: data?.totalItems || /* istanbul ignore next */ 0,
        pageSize: data?.pageSize || /* istanbul ignore next */ 10,
        pageCount: data?.totalPages || /* istanbul ignore next */ -1,
        pageIndex: data?.pageIndex || /* istanbul ignore next */ 0,
        gotoPage
      }}
    />
  )
}
