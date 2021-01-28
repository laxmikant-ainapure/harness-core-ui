import React from 'react'
import { WizardWithProgress } from '@common/components/WizardWithProgress/WizardWithProgress'
import { Status } from '@common/components/WizardWithProgress/WizardHelper'

import { GetDelegateTitleTextByType } from '@delegates/pages/delegates/utils/DelegateHelper'

import type { DelegateInfoDTO } from '@delegates/DelegateInterface'
import { DelegateTypes } from '@delegates/constants'
import DelegateSetupStep from './DelegateSetupStep/DelegateSetupStep'
import Stepk8ReviewScript from './StepReviewScript/Stepk8sReviewScript'

import StepSuccessVerification from './StepSuccessVerification/StepSuccessVerifcation'
import css from './CreateK8sDelegate.module.scss'

interface CreateK8sDelegateProps {
  delegateInfo?: DelegateInfoDTO | void
  onBack: any
}

const CreateK8sDelegate: React.FC<CreateK8sDelegateProps> = props => {
  const panels = [
    {
      tabTitle: 'Delegate Setup',
      id: 'delegateSetup',
      status: Status.INPROGRESS
    },
    { tabTitle: 'Review Script', id: 'reviewScript', status: Status.TODO },
    {
      tabTitle: 'Verification ',
      id: 'verifications',
      status: Status.TODO
    }
  ]

  return (
    <>
      <WizardWithProgress
        title={GetDelegateTitleTextByType(DelegateTypes.KUBERNETES_CLUSTER)}
        isNavMode={false}
        className={css.stepWizard}
        panels={panels}
      >
        <DelegateSetupStep
          onBack={() => {
            props?.onBack()
          }}
        />
        <Stepk8ReviewScript />
        <StepSuccessVerification />
      </WizardWithProgress>
    </>
  )
}

export default CreateK8sDelegate
