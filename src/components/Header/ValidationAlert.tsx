import { Alert, AlertDescription, AlertTitle } from '@ttab/elephant-ui'
import { useCollaboration, useQuery, useRegistry, useYValue } from '@/hooks'
import type { ElephantValidationMessage } from '@/types/index'
import { Files, FileWarning } from '@ttab/elephant-ui/icons'
import useSWR from 'swr'
import { useSession } from 'next-auth/react'
import { Repository } from '@/shared/Repository'
import { useMemo, useRef, useState } from 'react'
import { type ValidationResult } from '@/protos/service'


export const ValidationAlert = (): JSX.Element | null => {
  const { id: documentId } = useQuery()
  const { data: session } = useSession()
  const { server: { repositoryUrl } } = useRegistry()
  const { provider, synced } = useCollaboration()

  const [validationErrorServer, setValidationErrorServer] = useYValue<ElephantValidationMessage | undefined>('validation')
  const [validationErrorClient, setValidationErrorClient] = useState<string | undefined>()

  const attempt = useRef(1)

  const repository = useMemo(() => new Repository(repositoryUrl.href), [repositoryUrl.href])

  // If validation error is found, start polling for updated validation status
  const { error } = useSWR(
    documentId && synced ? [`validation/${documentId}`] : null,
    async () => {
      if (!session || !repositoryUrl || !documentId) return undefined

      const yDoc = provider?.document
      if (!yDoc) return

      const result = await repository.validateDoc(yDoc)

      // No errors left, reset error statuses
      if (result.response.errors.length === 0) {
        setValidationErrorServer(undefined)
        setValidationErrorClient(undefined)
      } else {
        const message = createValidationMessage(result.response.errors)

        if (message !== validationErrorClient) {
          setValidationErrorClient(message)
        }
      }

      attempt.current = attempt.current + 2
    },

    // Increase refreshInterval by a factor of 0.1 each attempt
    { refreshInterval: validationErrorServer ? 10000 * (attempt.current / 10 + 1) : 0 })

  if (error) {
    console.error(error)
  }

  // If validation is not found, return null
  if (!validationErrorServer && !validationErrorClient) return null

  return (
    <Alert variant='destructive'>
      <FileWarning strokeWidth={1.75} size={18} />
      <Files size={18} strokeWidth={1.75} />
      <AlertTitle>Valideringsfel</AlertTitle>
      {validationErrorClient && (
        <AlertDescription>
          <pre>{validationErrorClient}</pre>
        </AlertDescription>)}

      {validationErrorServer && !validationErrorClient && Object.keys(validationErrorServer.meta).map((key) => (
        <AlertDescription key={key} className='py-1'>
          <pre>{`${key}: ${validationErrorServer.meta[key].toString()}`}</pre>
        </AlertDescription>
      ))}
    </Alert>
  )
}

function createValidationMessage(errors: ValidationResult[]): string {
  return errors.map((error, index) => {
    const entityDescriptions = error.entity.map(entity => {
      if (entity.refType === 'attribute') {
        return `attribute "${entity.name}"`
      } else if (entity.refType === 'block') {
        return `${entity.kind} block (${entity.type})`
      } else {
        return ''
      }
    }).join(' of ')

    return `${index}: ${entityDescriptions}: ${error.error}`
  }).join('\n')
}

