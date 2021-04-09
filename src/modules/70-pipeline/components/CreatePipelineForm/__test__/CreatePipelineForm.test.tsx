import React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import { defaultAppStoreValues } from '@common/utils/DefaultAppStoreData'

import { CreatePipelineForm } from '../CreatePipelineForm'

const closeModalMock = jest.fn()
describe('CreatePipelineForm', () => {
  const props = {
    handleSubmit: jest.fn(),
    closeModal: closeModalMock
  }
  describe('Rendering', () => {
    test('should render CreatePipelineForm', () => {
      const { container } = render(
        <TestWrapper
          path="/account/:accountId"
          pathParams={{ accountId: 'testAcc' }}
          defaultAppStoreValues={defaultAppStoreValues}
        >
          <CreatePipelineForm {...props} />
        </TestWrapper>
      )
      expect(container).toMatchSnapshot()
    })

    test('should closeModal when click Setup Later', async () => {
      const { container, getByText } = render(
        <TestWrapper
          path="/account/:accountId"
          pathParams={{ accountId: 'testAcc' }}
          defaultAppStoreValues={defaultAppStoreValues}
        >
          <CreatePipelineForm {...props} />
        </TestWrapper>
      )
      fireEvent.click(getByText('Setup Later'))
      await waitFor(() => expect(closeModalMock).toBeCalled())
      expect(container).toMatchSnapshot()
    })

    test('should validate inputs', async () => {
      const { container, getByText } = render(
        <TestWrapper
          path="/account/:accountId"
          pathParams={{ accountId: 'testAcc' }}
          defaultAppStoreValues={defaultAppStoreValues}
        >
          <CreatePipelineForm {...props} />
        </TestWrapper>
      )
      fireEvent.click(getByText('Start'))
      await waitFor(() => expect(getByText('Pipeline Name is a required field')).toBeDefined())
      expect(container).toMatchSnapshot()
    })
  })
})
