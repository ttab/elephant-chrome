import { Alert, AlertDescription, AlertTitle } from '@ttab/elephant-ui'
import { useCollaboration, useQuery, useRegistry } from '@/hooks'
import type { ValidateStateRef } from '@/types/index'
import { Files, FileWarning } from '@ttab/elephant-ui/icons'
import useSWR from 'swr'
import { useSession } from 'next-auth/react'
import { Repository } from '@/shared/Repository'
import { useMemo } from 'react'
import { type ValidationResult } from '@ttab/elephant-api/repository'

interface Entity {
  refType: string
  type: string
  name?: string
  kind?: string
}

export const ValidationAlert = ({ validateStateRef }: {
  validateStateRef: ValidateStateRef
}): JSX.Element | null => {
  const { id: documentId } = useQuery()
  const { data: session } = useSession()
  const { server: { repositoryUrl } } = useRegistry()
  const { provider, synced } = useCollaboration()

  const repository = useMemo(() => new Repository(repositoryUrl.href), [repositoryUrl.href])

  const fetcher = async (): Promise<string | undefined | null> => {
    if (!session || !repositoryUrl || !documentId) return undefined

    const yDoc = provider?.document
    if (!yDoc) return null

    const result = await repository.validateDoc(yDoc)

    if (result.response.errors.length === 0) {
      return null
    } else {
      const message = createValidationMessage(result.response.errors, validateStateRef)

      if (message.length) {
        return message.join('\n')
      } else {
        return null
      }
    }
  }


  // If validation error is found, start polling for updated validation status
  const { data: validationError, error } = useSWR(
    documentId && synced ? [`validation/${documentId}`] : null,
    fetcher,

    // TODO: Implement exponential backoff, is it possible with SWR?
    // refreshInterval cannot be changed without causing a re-render
    // Should maybe be event based, on change, with a debounce
    { refreshInterval: 20000 })

  if (error) {
    console.error(error)
  }

  if (!validationError) return null

  return (
    <Alert variant='destructive'>
      <FileWarning strokeWidth={1.75} size={18} />
      <Files size={18} strokeWidth={1.75} />
      <AlertTitle>Valideringsfel</AlertTitle>
      <AlertDescription>
        <pre className='whitespace-pre-wrap break-words'>{validationError}</pre>
      </AlertDescription>
    </Alert>
  )
}

function isBlockAndInvalid(entity: Entity, validateStateRef: ValidateStateRef): boolean {
  return (entity.refType === 'block' &&
    validateStateRef.current?.[entity?.type] &&
      !validateStateRef.current[entity.type].valid)
}

function hasInvalidBlock(error: ValidationResult, validateStateRef: ValidateStateRef): boolean {
  return error.entity.some(entity => isBlockAndInvalid(entity, validateStateRef))
}

function createValidationMessage(errors: ValidationResult[], validateStateRef: ValidateStateRef): string[] {
  return errors
    .filter(error => !hasInvalidBlock(error, validateStateRef))
    .map((error, index) => {
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
    })
}

