import React from 'react'
import { connect } from 'formik'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import { FormGroup, Dialog, Icon, Spinner } from '@blueprintjs/core'
import { useModalHook, Container, Text, Color } from '@wings-software/uikit'
import classnames from 'classnames'
import JsonSelector from './JsonSelector'
import css from './JsonSelectorFormInput.module.scss'

interface JsonSelectorFormInputProps {
  name: string
  label: string
  json?: object
  loading?: boolean
  placeholder?: string
}

function getPlaceholderAndTextColor(
  loading?: boolean,
  json?: object,
  placeholder?: string,
  selectedJsonVal?: string
): { value?: string; valueColor: Color } {
  if (loading) {
    return { value: '', valueColor: Color.BLACK }
  } else if (!selectedJsonVal || !Object.keys(selectedJsonVal)?.length) {
    return { value: !json || !Object.keys(json)?.length ? 'No data' : placeholder, valueColor: Color.GREY_400 }
  }
  return { value: selectedJsonVal, valueColor: Color.BLACK }
}

const JsonSelectorFormInput = (props: JsonSelectorFormInputProps & { formik?: any }): JSX.Element => {
  const { name, label, json, formik, loading, placeholder } = props
  const { value, valueColor } = getPlaceholderAndTextColor(loading, json, placeholder, get(formik.values, name))
  const validationError = get(formik.touched, name) ? get(formik.errors, name) : undefined

  const onPathSelect = (path: string): void => {
    hideModal()
    formik.setFieldValue(name, path)
    formik.setFieldTouched(name, true)
  }

  const onOpenModal = (): void => {
    if (!isEmpty(json)) openModal()
  }

  const [openModal, hideModal] = useModalHook(
    () => (
      <Dialog
        isOpen
        usePortal
        autoFocus
        canEscapeKeyClose
        canOutsideClickClose
        enforceFocus
        onClose={hideModal}
        style={{ width: 1200, height: 600, borderLeft: 0, paddingBottom: 0, position: 'relative', overflow: 'hidden' }}
      >
        <div className={css.dialogContent}>
          <div className={css.leftColumn}>
            Select service <br /> instance field name
          </div>
          <JsonSelector className={css.rightColumn} json={json || {}} onPathSelect={onPathSelect} />
        </div>
      </Dialog>
    ),
    [json]
  )

  return (
    <FormGroup
      labelFor={name}
      label={label}
      helperText={validationError}
      intent={validationError?.length ? 'danger' : undefined}
    >
      <Container className={classnames('bp3-input-group', css.inputGroup)}>
        <Container className={classnames('bp3-input', css.input)} onClick={onOpenModal}>
          <Text color={valueColor}>{value}</Text>
        </Container>
        {loading ? (
          <Spinner size={8} className={css.loadingJsonIcon} />
        ) : (
          <Icon className={css.inputIcon} icon="plus" iconSize={12} />
        )}
      </Container>
    </FormGroup>
  )
}

export default connect(JsonSelectorFormInput)
