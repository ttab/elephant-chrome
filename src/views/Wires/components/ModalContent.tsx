import { Badge, SheetClose, ToggleGroup, ToggleGroupItem } from '@ttab/elephant-ui'
import { Check, Save, X } from '@ttab/elephant-ui/icons'
import { Editor } from '../../../components/PlainEditor'
import { FaroErrorBoundary } from '@grafana/faro-react'
import { Error } from '@/views'
import { useDocumentStatus } from '@/hooks/useDocumentStatus'
import { useNavigationKeys } from '@/hooks/useNavigationKeys'

export const ModalContent = ({ id, source, role, handleClose }: {
  id: string
  source?: string
  textOnly?: boolean
  role?: string
  handleClose: () => void
}): JSX.Element => {
  const [documentStatus, setDocumentStatus] = useDocumentStatus(id)

  useNavigationKeys({
    keys: ['s', 'l'],
    onNavigation: (event) => {
      if (event.key === 'l') {
        setDocumentStatus('approved').catch((error) => console.error(error))
        return
      }

      if (event.key === 's') {
        setDocumentStatus('done').catch((error) => console.error(error))
        return
      }
    }
  })

  return (
    <FaroErrorBoundary
      fallback={(error) => <Error error={error} />}
    >
      <div className='w-full flex flex-col gap-4'>
        <div className='flex flex-row gap-6 justify-between items-center'>
          <div className='flex flex-row gap-2'>
            {source && (
              <Badge
                className='w-fit h-6 justify-center align-center'
              >
                {source.replace('wires://source/', '')}
              </Badge>
            )}
            {role === 'pressrelease' && (
              <Badge
                variant='destructive'
                className='w-fit h-6 justify-center align-center'
              >
                Pressmeddelande
              </Badge>
            )}
          </div>

          <div className='flex flex-row gap-2'>
            <ToggleGroup
              type='single'
              size='xs'
              value={documentStatus?.name}
              onValueChange={(value) => {
                if (!value && documentStatus) {
                  setDocumentStatus({
                    name: 'draft',
                    version: documentStatus.version,
                    uuid: documentStatus.uuid
                  }).catch(console.error)
                } else {
                  setDocumentStatus(value).catch(console.error)
                }
              }}
            >
              <ToggleGroupItem
                value='done'
                aria-label='Toggle save'
                className='border
              !border-done-border
              data-[state="on"]:!bg-done
              data-[state="off"]:!bg-done-background
              data-[state="off"]:!text-muted-foreground'
              >
                <Save className='h-4 w-4' />
              </ToggleGroupItem>
              <ToggleGroupItem
                value='approved'
                aria-label='Toggle check'
                className='border
              !border-approved-border
              data-[state="on"]:!bg-approved
              data-[state="off"]:!bg-approved-background
              data-[state="off"]:!text-muted-foreground'
              >
                <Check className='h-4 w-4' />
              </ToggleGroupItem>
            </ToggleGroup>

            <SheetClose
              className='rounded-md hover:bg-gray-100 w-9 h-9 flex items-center justify-center outline-none'
              onClick={handleClose}
            >
              <X strokeWidth={1.75} size={18} />
            </SheetClose>
          </div>
        </div>
        <div className='flex-2 -mt-2'>
          <Editor id={id} textOnly />
        </div>
      </div>
    </FaroErrorBoundary>
  )
}
