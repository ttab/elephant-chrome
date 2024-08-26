import { Awareness } from '@/components'
import { ComboBox } from '@/components/ui'
import { DocumentStatuses } from '@/defaults'
import { useSession } from 'next-auth/react'
import { useRef } from 'react'
import { type DefaultValueOption } from '@/types'
import { Repository } from '@/lib/repository'
import useSWR from 'swr'
import { type MetaHead } from '@/lib/repository/metaSearch'
import { useRegistry } from '@/hooks'

interface Status {
  name: string
  version: number
  documentId: string
}

export const PlanDocumentStatus = ({ documentId }: { documentId: string }): JSX.Element => {
  const { server: { repositoryUrl } } = useRegistry()
  const { data: documentStatus, mutate } = useSWR([`status/${documentId}`], async () => {
    const _meta = await Repository.metaSearch({ session, documentId, repositoryUrl })
    const version = _meta.meta.current_version
    const heads: MetaHead = _meta?.meta?.heads
    const headsEntries = Object.entries(heads)
    const currentStatus = headsEntries.sort((a, b) => a[1].created > b[1].created ? -1 : 0)[0][0]
    const status = {
      version: +version,
      name: currentStatus,
      documentId
    }
    return status
  })
  const { data: session } = useSession()
  const setFocused = useRef<(value: boolean) => void>(null)

  const selectedOption = DocumentStatuses.find(type => type.value === (documentStatus?.name || 'draft'))

  const handleOnSelect = (option: DefaultValueOption, currentStatus?: Status): void => {
    (async () => {
      if (currentStatus?.version) {
        const selectedStatusName = option.value
        const newStatus = {
          name: selectedStatusName,
          version: currentStatus.version,
          documentId: currentStatus.documentId
        }
        await Repository.update({ session, status: newStatus })
        await mutate(newStatus, { optimisticData: newStatus, revalidate: false })
      }
    })().catch(error => console.error(error))
  }

  return (
    <Awareness name='PlanDocumentStatus' ref={setFocused}>
      <ComboBox
        className='h-9 w-9 p-0'
        options={DocumentStatuses}
        variant={'ghost'}
        selectedOption={selectedOption}
        onSelect={(option) => handleOnSelect(option, documentStatus)}
        hideInput
      >
        {selectedOption?.icon
          ? <selectedOption.icon {...selectedOption.iconProps}
          />
          : selectedOption?.label
        }
      </ComboBox>
    </Awareness>
  )
}
