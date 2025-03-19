import { Select, SelectContent, SelectItem, SelectTrigger } from '@ttab/elephant-ui'
import { useRegistry } from '@/hooks/useRegistry'
import { useCallback, useMemo, useState } from 'react'
import useSWR from 'swr'
import { useSession } from 'next-auth/react'
import { useModal } from '../Modal/useModal'
import { PreviewSheet } from '@/views/Wires/components'
import { format } from 'date-fns'
import { useAuthors } from '@/hooks/useAuthors'
import { getCreatorBySub } from './getCreatorBySub'
import { DocumentStatuses } from '@/defaults/documentStatuses'
import type { GetHistoryResponse } from '@ttab/elephant-api/repository'
import type { DocumentVersion } from '@ttab/elephant-api/repository'
import { Error } from '@/views/Error'
import { STATUS_KEYS } from './statuskeys'

type Status = { name: string, created: string, creator: string }

export type SelectedVersion = Pick<DocumentVersion, 'created' | 'version' | 'creator'> & {
  createdBy?: string
  lastStatus?: Status
}

export const Version = ({ documentId, hideDetails = false }: { documentId: string, hideDetails?: boolean }) => {
  const { repository } = useRegistry()
  const { data: session } = useSession()
  const authors = useAuthors()
  const [lastUpdated, setLastUpdated] = useState('')

  const { data: versionHistory, error } = useSWR(`version/${documentId}`, async (): Promise<Array<DocumentVersion>> => {
    if (!session?.accessToken || !repository) {
      return []
    }

    const result: GetHistoryResponse | null = await repository.getHistory({ accessToken: session.accessToken, uuid: documentId })

    if (result === null) {
      return []
    }

    if (!result?.versions.length) {
      return []
    }

    // Setting time for when last version was created
    setLastUpdated(result.versions[0].created)

    // We're only interested in versions with set statuses
    result.versions = result.versions.filter((v) => {
      const statuskeys = Object.keys(v.statuses)
      if (!statuskeys.length) {
        return v
      }
      return statuskeys.some((key) => STATUS_KEYS.includes(key))
    })

    const getLastReadOrSaved = (version: DocumentVersion) => {
      if (version?.creator.includes('elephant-wires')) {
        return Object.entries(version.statuses).map((s) => {
          const [name, data] = s
          const lastCreated = data.items.sort((a, b) => a.created > b.created ? -1 : 1)[0]
          const creator = lastCreated.creator
          const created = lastCreated.created
          return { name, created, creator }
        })?.sort((a, b) => a.created > b.created ? -1 : 1)[0]
      }
    }

    // Set last version as starting point
    const lastStatus = getLastReadOrSaved(result?.versions[0])

    const createdBy = getCreatorBySub({
      authors,
      creator: lastStatus?.creator || result?.versions[0]?.creator
    })?.name || '???'

    setVersion({
      ...result?.versions[0],
      createdBy,
      lastStatus
    })
    return result?.versions
  })

  const [selectedVersion, setVersion] = useState<SelectedVersion>()
  const { showModal, hideModal } = useModal()

  const createdBy = useCallback((creator: string) => getCreatorBySub({ authors, creator })?.name || '???', [authors])

  const formatDateAndTime = (date: string) => {
    if (date) {
      return format(date, 'yyyy-MM-dd HH:mm')
    }
    return ''
  }

  const VersionStack = useMemo(() => {
    if (!documentId) {
      return <></>
    }

    const getUsable = (version: DocumentVersion): Status | undefined => {
      let status: Status = { name: '', created: '', creator: '' }

      const statuses = [
        ...DocumentStatuses,
        {
          label: 'Läst',
          value: 'read'
        },
        {
          label: 'Sparad',
          value: 'saved'
        },
        {
          label: 'Använd',
          value: 'used'
        }
      ]

      if (!Object.keys(version?.statuses)?.length) {
        return { ...status, creator: createdBy(version.creator), created: version.created }
      }

      for (const key in version?.statuses) {
        if (STATUS_KEYS.includes(key)) {
          const item = version.statuses[key]?.items[0]
          const name = statuses.find((s) => s.value === key)?.label || ''

          status = { name, created: version.created, creator: createdBy(item.creator) || createdBy(version.creator) }
        }
      }
      return status
    }

    return versionHistory?.map((v) => {
      const usable = getUsable(v)
      return (
        <SelectItem
          key={`${usable?.created}-${v.version}`}
          value={v.version.toString()}
        >
          <div className='flex items-center gap-2'>
            {usable?.created && <span>{`${formatDateAndTime(usable.created)}`}</span>}
            <span>{`${usable?.name} av ${usable?.creator || '???'}`}</span>
          </div>
        </SelectItem>
      )
    })
  }, [documentId, versionHistory, createdBy])

  if (!versionHistory?.length) {
    return <></>
  }

  if (error) {
    console.error('Error fetching version history', error)
    return (
      <Error
        title='Fel'
        message='Det uppstod ett fel när dokumenthistoriken hämtades.'
      />
    )
  }

  return (
    <>
      <Select
        value={`${selectedVersion?.version}`}
        onValueChange={(option) => {
          const current = versionHistory?.find((v) => v.version === BigInt(option))
          showModal(
            <PreviewSheet
              id={documentId}
              preVersion={current?.version && BigInt(current?.version)}
              versionHistory={versionHistory}
              textOnly
              handleClose={hideModal}
            />,
            'sheet',
            {
              id: documentId
            })
        }}
      >
        <div className='border rounded p-1'>
          {lastUpdated && <div className='text-sm italic pb-2'>{`Senast uppdaterad: ${formatDateAndTime(lastUpdated)}`}</div>}
          <SelectTrigger className='py-0 px-1 h-6 w-full'>
            {selectedVersion && (
              <div className='w-full'>{`${formatDateAndTime(selectedVersion.created)}`}</div>
            )}
          </SelectTrigger>
          {!hideDetails && selectedVersion?.createdBy && (
            <div className='text-sm italic'>{`Skapad av ${selectedVersion?.createdBy}`}</div>
          )}
        </div>
        <SelectContent>
          {VersionStack}
        </SelectContent>
      </Select>
    </>
  )
}
