import { Select, SelectContent, SelectItem, SelectTrigger } from '@ttab/elephant-ui'
import { useRegistry } from '@/hooks/useRegistry'
import { useMemo, useState } from 'react'
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
import type { EleDocumentResponse } from '@/shared/types'

export type SelectedVersion = Pick<DocumentVersion, 'created' | 'version' | 'creator'> & { createdBy?: string, title?: string }
type Status = { name: string, created: string, creator: string }

export const Version = ({ documentId, hideDetails = false }: { documentId: string, hideDetails?: boolean }) => {
  const { repository } = useRegistry()
  const { data: session } = useSession()
  const authors = useAuthors()
  const BASE_URL = import.meta.env.BASE_URL || ''
  const [lastUpdated, setLastUpdated] = useState('')

  const { data: versionHistory, error } = useSWR(`version/${documentId}`, async (): Promise<Array<DocumentVersion & { title?: string }>> => {
    if (!session?.accessToken || !repository) {
      return []
    }

    console.log('documentId', documentId)
    const result: GetHistoryResponse | null = await repository.getHistory({ accessToken: session.accessToken, uuid: documentId })
    console.log('result', result)

    if (result === null) {
      return []
    }

    if (!result?.versions.length) {
      return []
    }

    setLastUpdated(result.versions[0].created)

    result.versions = result.versions.filter((v) => {
      // For now, we're only interested in displaying 'usable' statuses
      return Object.keys(v.statuses).some((k) => k === 'usable')
    })

    const fetchDoc = async (v: DocumentVersion) => {
      // Used to fetch the previous document version in order to get hold of the title,
      // that can be displayed in the list of previous versions.
      const response = await fetch(`${BASE_URL}/api/documents/${documentId}?version=${v.version}`)
      return await response.json()
    }

    result.versions = await Promise.all(result.versions.map(async (version) => {
      const versionDoc = await fetchDoc(version) as EleDocumentResponse

      if (versionDoc) {
        const doc = versionDoc?.document
        let docTitle = ''
        let headingTitle = ''
        if (doc?.title) {
          docTitle = doc.title
        }

        if (doc?.content.length) {
          // If we're dealing with an article, the title can be found in the heading,
          // in case the document title is empty
          const heading = doc?.content?.find((c) => c?.properties?.role === 'heading-1')?.children[0]
          if (heading && 'text' in heading) {
            headingTitle = heading?.text
          }
        }

        return {
          ...version,
          title: docTitle || headingTitle
        }
      }
      return version
    }))

    const createdBy = getCreatorBySub({ authors, creator: result?.versions[0].creator })?.name || '???'

    setVersion({
      ...result?.versions[0],
      createdBy
    })
    return result?.versions
  })

  if (error) {
    console.error('Error fetching version history', error)
  }

  const [selectedVersion, setVersion] = useState<SelectedVersion>()
  const { showModal, hideModal } = useModal()

  const createdBy = getCreatorBySub({ authors, creator: selectedVersion?.creator })?.name || '???'

  const formatDateAndTime = (date: string) => {
    if (date) {
      return format(date, 'yyyy-MM-dd HH:mm')
    }
    return ''
  }

  const getUsable = (version: DocumentVersion): Status | undefined => {
    let status: Status = { name: '', created: '', creator: '' }

    if (!version?.statuses) {
      return
    }

    // For now, we're only interested in displaying 'usable' statuses
    for (const key in version?.statuses) {
      if (key === 'usable') {
        const item = version.statuses[key]?.items[0]
        const name = DocumentStatuses.find((s) => s.value === key)?.label || ''
        status = { name, created: version.created, creator: item.creator }
      }
    }
    return status
  }

  const VersionStack = useMemo(() => {
    if (!documentId) {
      return <></>
    }

    return versionHistory?.map((v) => {
      const usable = getUsable(v)
      return (
        <SelectItem
          key={`${usable?.created}-${v.version}`}
          value={JSON.stringify(v, (_, value) => typeof value === 'bigint' ? Number(value) : value)}
        >
          <span className='hidden sm:block font-bold pr-2'>{`${v?.title}`}</span>
          {usable?.created && <span className='pr-2'>{`${formatDateAndTime(usable.created)}`}</span>}
          <span>{createdBy}</span>
        </SelectItem>
      )
    })
  }, [documentId, versionHistory, createdBy])

  if (!versionHistory?.length) {
    return <></>
  }

  return (
    <>
      <Select
        value={`${selectedVersion?.version}`}
        onValueChange={(option) => {
          const { version, created, creator, title } = JSON.parse(option)
          setVersion({ version, created, creator, createdBy, title })
          showModal(
            <PreviewSheet
              id={documentId}
              previewVersion={BigInt(version as number)}
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
          {!hideDetails && createdBy && (
            <>
              <div className='font-bold truncate max-w-1/2 text-sm pt-2'>{`${selectedVersion?.title}`}</div>
              <div className='text-sm italic'>{`Skapad av ${createdBy}`}</div>
            </>
          )}
        </div>
        <SelectContent>
          {VersionStack}
        </SelectContent>
      </Select>
    </>
  )
}
