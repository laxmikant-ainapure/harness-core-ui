import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import { defaultAppStoreValues } from '@common/utils/DefaultAppStoreData'

import CDTrial from '../CDTrial/CDTrial'

describe('CDTrial Modal', () => {
  const props = {
    handleSubmit: jest.fn(),
    closeModal: jest.fn
  }
  describe('Rendering', () => {
    test('should render CDTrial', () => {
      const { container } = render(
        <TestWrapper
          path="/account/:accountId"
          pathParams={{ accountId: 'testAcc' }}
          defaultAppStoreValues={defaultAppStoreValues}
        >
          <CDTrial {...props} />
        </TestWrapper>
      )
      expect(container).toMatchSnapshot()
    })

    test('should validate inputs', async () => {
      const { container, getByText } = render(
        <TestWrapper
          path="/account/:accountId"
          pathParams={{ accountId: 'testAcc' }}
          defaultAppStoreValues={defaultAppStoreValues}
        >
          <CDTrial {...props} />
        </TestWrapper>
      )
      fireEvent.click(getByText('Start'))
      await waitFor(() => expect(getByText('Pipeline Name is a required field')).toBeDefined())
      expect(container).toMatchSnapshot()
    })
  })
})
