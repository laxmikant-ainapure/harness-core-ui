import React, { useState, useEffect } from 'react'
import { Container, Button } from '@wings-software/uikit'
import { parse } from 'yaml'
import { useHistory, useParams } from 'react-router-dom'

import YAMLBuilder from '@common/components/YAMLBuilder/YamlBuilder'
import { addIconInfoToSnippets } from '@common/components/YAMLBuilder/YAMLBuilderUtils'
import { YamlEntity } from '@common/constants/YamlConstants'
import { PageBody } from '@common/components/Page/PageBody'
import { PageHeader } from '@common/components/Page/PageHeader'
import type { YamlBuilderHandlerBinding } from '@common/interfaces/YAMLBuilderProps'
import { usePostSecretViaYaml } from 'services/cd-ng'
import { useToaster } from '@common/exports'
import { routeSecretDetails } from 'navigation/accounts/routes'
import { YAMLService } from '@common/services'
import type { SnippetInterface } from '@common/interfaces/SnippetInterface'

const CreateSecretFromYamlPage: React.FC = () => {
  const { accountId } = useParams()
  const [yamlHandler, setYamlHandler] = useState<YamlBuilderHandlerBinding | undefined>()
  const history = useHistory()
  const [snippets, setSnippets] = useState<SnippetInterface[]>()
  const { showSuccess, showError } = useToaster()
  const { mutate: createSecret } = usePostSecretViaYaml({
    queryParams: { accountIdentifier: accountId },
    requestOptions: { headers: { 'content-type': 'application/yaml' } }
  })

  const fetchSnippets = (query?: string): void => {
    const { error: apiError, response: snippetsList } = YAMLService.fetchSnippets(YamlEntity.SECRET, query) || {}
    if (apiError) {
      showError(apiError)
      return
    }
    addIconInfoToSnippets('command-shell-script', snippetsList)
    setSnippets(snippetsList)
  }

  useEffect(() => {
    fetchSnippets()
  })

  const handleCreate = async (): Promise<void> => {
    const yamlData = yamlHandler?.getLatestYaml()
    let jsonData
    try {
      jsonData = parse(yamlData || '')?.secret
    } catch (err) {
      showError(err.message)
    }

    if (yamlData && jsonData) {
      try {
        await createSecret(yamlData as any)
        showSuccess('Secret created successfully')
        history.push(routeSecretDetails.url({ secretId: jsonData['identifier'] }))
      } catch (err) {
        showError(err.data?.message || err.message)
      }
    } else {
      showError('Invalid Secret configuration')
    }
  }

  return (
    <PageBody>
      <PageHeader title="Create Secret from YAML" />
      <Container padding="xlarge">
        <YAMLBuilder fileName="New Secret" entityType={YamlEntity.SECRET} bind={setYamlHandler} snippets={snippets} />
        <Button text="Create" intent="primary" margin={{ top: 'xlarge' }} onClick={handleCreate} />
      </Container>
    </PageBody>
  )
}

export default CreateSecretFromYamlPage
