import { Badge, SheetClose, ToggleGroup, ToggleGroupItem, Tooltip } from '@ttab/elephant-ui'
import { Check, FilePlus2, Save, X } from '@ttab/elephant-ui/icons'
import { Editor } from '../../../components/PlainEditor'
import { FaroErrorBoundary } from '@grafana/faro-react'
import { Error, Wire } from '@/views'
import { useNavigationKeys } from '@/hooks/useNavigationKeys'
import { useModal } from '@/components/Modal/useModal'
import type { Wire as WireType } from '@/hooks/index/useDocuments/schemas/wire'
import type { Status as DocumentStatuses } from '@ttab/elephant-api/repository'
import { MetaSheet } from '@/views/Editor/components/MetaSheet'
import { useEffect, useRef } from 'react'
import { useWorkflowStatus } from '@/hooks/useWorkflowStatus'
import { decodeString } from '@/lib/decodeString'
import { getWireStatus } from '@/components/Table/lib/getWireStatus'

export const PreviewSheet = ({ id, wire, handleClose, textOnly = true, version, versionStatusHistory }: {
  id: string
  wire?: WireType
  textOnly?: boolean
  version?: bigint
  versionStatusHistory?: DocumentStatuses[]
  handleClose: () => void
}): JSX.Element => {
  const [documentStatus, setDocumentStatus, mutate] = useWorkflowStatus(id)
  const { showModal, hideModal } = useModal()

  const containerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    containerRef.current = (document.getElementById(id))
  }, [id])

  useNavigationKeys({
    keys: ['s', 'r', 'c', 'u', 'Escape'],
    onNavigation: (event) => {
      event.stopPropagation()
      if (documentStatus) {
        if (event.key === 'r') {
          const payload = {
            name: currentStatus === 'read' ? 'draft' : 'read',
            version: documentStatus?.version,
            uuid: documentStatus?.uuid
          }

          void setDocumentStatus(payload, undefined, true)
          void mutate(payload, false)

          return
        }

        if (event.key === 's') {
          const payload = {
            name: currentStatus === 'saved' ? 'draft' : 'saved',
            version: documentStatus?.version,
            uuid: documentStatus?.uuid
          }

          void setDocumentStatus(payload, undefined, true)
          void mutate(payload, false)

          return
        }

        if (event.key === 'u') {
          const payload = {
            name: currentStatus === 'used' ? 'draft' : 'used',
            version: documentStatus?.version,
            uuid: documentStatus?.uuid
          }

          void setDocumentStatus(payload, undefined, true)
          void mutate(payload, false)

          return
        }

        if (event.key === 'c') {
          showModal(<Wire onDialogClose={hideModal} asDialog wire={wire} />)
          return
        }

        if (event.key === 'Escape') {
          handleClose()
        }
      }
    }
  })


  if (!wire) {
    return <p>No wire id provided</p>
  }

  const source = wire.fields['document.rel.source.uri']?.values[0]
    ?.replace('wires://source/', '')

  const provider = wire.fields['document.rel.provider.uri']?.values[0]
    ?.replace('wires://provider/', '')

  const role = wire.fields['document.meta.tt_wire.role'].values[0]
  const newsvalue = wire.fields['document.meta.core_newsvalue.value']?.values[0]
  const currentVersion = BigInt(wire.fields['current_version']?.values[0] || '')
  const currentStatus = getWireStatus('Wires', wire)

  return (
    <FaroErrorBoundary fallback={(error) => <Error error={error} />}>
      <div className='w-full flex flex-col gap-4'>
        <div className='flex flex-row gap-6 justify-between items-center'>
          <div className='flex flex-row gap-2'>
            {source && (
              <Badge className='w-fit h-6 justify-center align-center'>
                {source}
              </Badge>
            )}
            {provider && provider !== source && provider.toLocaleLowerCase() !== source && (
              <Badge className='w-fit h-6 justify-center align-center'>
                {decodeString(provider)}
              </Badge>
            )}
            {role === 'pressrelease' && (
              <Badge
                className='w-fit h-6 justify-center align-center bg-gray-400'
              >
                Pressmeddelande
              </Badge>
            )}

            {newsvalue === '6' && (
              <Badge
                variant='destructive'
                className='w-fit h-6 justify-center align-center'
              >
                Flash
              </Badge>
            )}
          </div>

          <div className='flex flex-row gap-2'>
            {wire && (
              <>
                <ToggleGroup
                  type='single'
                  size='xs'
                  disabled={documentStatus?.name === 'used'}
                  value={documentStatus?.version === currentVersion
                    ? documentStatus?.name
                    : ''}
                  onValueChange={(value) => {
                    if (!value && documentStatus) { // reset status to draft
                      void setDocumentStatus({
                        name: 'draft',
                        version: documentStatus.version,
                        uuid: documentStatus.uuid
                      }, undefined, true)
                    } else if (documentStatus && value) { // set status to saved, read or used
                      void setDocumentStatus({
                        name: value,
                        version: documentStatus?.version,
                        uuid: documentStatus?.uuid
                      }, undefined, true)
                    }
                  }}
                >

                  <Tooltip
                    content='Markera som sparad'
                  >
                    <ToggleGroupItem
                      value='saved'
                      aria-label='Toggle save'
                      className='border
              !border-done-border
              data-[state="on"]:!bg-done
              data-[state="off"]:!bg-done-background
              data-[state="off"]:!text-muted-foreground'
                    >
                      <Save className='h-4 w-4' />
                    </ToggleGroupItem>
                  </Tooltip>

                  <Tooltip
                    content='Markera som läst'
                  >
                    <ToggleGroupItem
                      value='read'
                      aria-label='Toggle read'
                      className='border
              !border-approved-border
              data-[state="on"]:!bg-approved
              data-[state="off"]:!bg-approved-background
              data-[state="off"]:!text-muted-foreground'
                    >
                      <Check className='h-4 w-4' />
                    </ToggleGroupItem>
                  </Tooltip>
                  <Tooltip
                    content='Skapa artikel från telegram'
                  >
                    <ToggleGroupItem
                      value='used'
                      aria-label='Toggle used'
                      className='border
              !border-usable-border
              data-[state="on"]:!bg-usable
              data-[state="off"]:!bg-useable-background
              data-[state="off"]:!text-muted-foreground'
                      onClick={(event) => {
                        event.preventDefault()
                        const onDocumentCreated = () => {
                          setDocumentStatus({
                            name: 'used',
                            uuid: wire.id,
                            version: BigInt(wire.fields.current_version.values?.[0])
                          }, undefined, true).catch(console.error)
                        }
                        showModal(
                          <Wire
                            onDialogClose={hideModal}
                            asDialog
                            wire={wire}
                            onDocumentCreated={onDocumentCreated}
                          />
                        )
                      }}
                    >
                      <FilePlus2 className='h-4 w-4' />
                    </ToggleGroupItem>
                  </Tooltip>
                </ToggleGroup>
              </>
            )}
            <MetaSheet container={containerRef.current} documentId={id} />
            <SheetClose
              className='rounded-md hover:bg-gray-100 w-8 h-8 flex items-center justify-center outline-none -mr-7'
              onClick={handleClose}
            >
              <X strokeWidth={1.75} size={18} />
            </SheetClose>
          </div>
        </div>
        <div className='flex flex-col h-full'>
          <Editor id={id} textOnly={textOnly} version={version} versionStatusHistory={versionStatusHistory} />
        </div>
      </div>
    </FaroErrorBoundary>
  )
}
