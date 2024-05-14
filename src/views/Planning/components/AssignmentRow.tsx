import { Link } from '@/components'
import { useYObserver } from '@/hooks/useYObserver'
import { TimeDisplay } from '@/components/DataItem/TimeDisplay'
import { SluglineEditable } from '@/components/DataItem/SluglineInput'
import { AssignmentType } from '@/components/DataItem/AssignmentType'
import { AssigneeAvatars } from '@/components/DataItem/AssigneeAvatars'
import type * as Y from 'yjs'
import { DotDropdownMenu } from '@/components/ui/DotMenu'
import { useCollaboration } from '@/hooks'
import { Delete, Edit } from '@ttab/elephant-ui/icons'
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@ttab/elephant-ui'
import { useState } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@ttab/elephant-ui/utils'


export const AssignmentRow = ({ index, setSelectedAssignment }: {
  index: number
  setSelectedAssignment: React.Dispatch<React.SetStateAction<number | undefined>>
}): JSX.Element => {
  const { get } = useYObserver('meta', `core/assignment[${index}]`)
  const { get: getUUID } = useYObserver('meta', `core/assignment[${index}].links.core/article[0]`)
  const { get: getAssignmentDescription } = useYObserver('meta', `core/assignment[${index}].meta.core/description[0].data`)
  const { get: getAssignmentPublishTime } = useYObserver('meta', `core/assignment[${index}].data`)
  const { state: stateAuthor = [] } = useYObserver('meta', `core/assignment[${index}].links.core/author`)
  const [showVerifyDialog, setShowVerifyDialog] = useState<boolean>(false)

  const inProgress = !!get('__inProgress')
  const assignment = cva('grid grid-cols-12 border-b py-2', {
    variants: {
      inProgress: {
        true: 'opacity-50'
      }
    }
  })

  return (
    <div className={cn(assignment({ inProgress }))}>

      <div className="col-span-8 px-2 py-1">
        <div className="flex-grow flex space-x-2 items-center">

          {getUUID('uuid') && !inProgress
            ? <Link to='Editor' props={{ id: getUUID('uuid') as string }} className="font-semibold text-sm hover:underline">
              {(get('title') as Y.XmlText)?.toJSON()}
            </Link>
            : <span className='font-semibold text-sm text-muted-foreground'>{(get('title') as Y.XmlText)?.toJSON()}</span>}

          <SluglineEditable path={`core/assignment[${index}].meta.tt/slugline[0]`} />
        </div>

        <div className='font-normal text-sm mt-2'>{(getAssignmentDescription('text') as Y.XmlText)?.toJSON()}</div>
      </div>

      <div className="col-span-4 flex justify-end space-x-4 items-center">
        <AssigneeAvatars assignees={Array.isArray(stateAuthor) ? stateAuthor.map((author) => author.name) : []} />

        <AssignmentType index={index} />

        <div className="min-w-[64px] whitespace-nowrap">
          {getAssignmentPublishTime('publish')
            ? <TimeDisplay date={new Date(getAssignmentPublishTime('publish') as string)} />
            : '-'
          }
        </div>

        <div className="whitespace-nowrap">
          {!inProgress &&
            <DotDropdownMenu
              items={[
                {
                  label: 'Redigera',
                  icon: Edit,
                  item: () => setSelectedAssignment(index)
                },
                {
                  label: 'Ta bort',
                  icon: Delete,
                  item: () => {
                    setShowVerifyDialog(true)
                  }
                }
              ]}
            />
          }
        </div>
      </div>

      {showVerifyDialog &&
        <VerifyDeleteAssignmentDialog
          index={index}
          title={(get('title') as Y.XmlText)?.toJSON()}
          setSelectedAssignment={setSelectedAssignment}
          setShowVerifyDialog={setShowVerifyDialog}
        />
      }
    </div>
  )
}


const VerifyDeleteAssignmentDialog = ({ index, title, setSelectedAssignment, setShowVerifyDialog }: {
  index: number
  title: string
  setSelectedAssignment: React.Dispatch<React.SetStateAction<number | undefined>>
  setShowVerifyDialog: React.Dispatch<React.SetStateAction<boolean>>
}): JSX.Element => {
  const { provider } = useCollaboration()

  return (
    <Dialog open={true}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ta bort?</DialogTitle>
        </DialogHeader>

        <DialogDescription>
          {title
            ? <>Vill du ta bort uppdraget <em>{title}</em>?</>
            : <>Vill du ta bort uppdraget?</>
          }
        </DialogDescription>

        <DialogFooter className="flex flex-col gap-2 pt-4">
          <Button
            variant="secondary"
            onClick={(evt) => {
              evt.preventDefault()
              setShowVerifyDialog(false)
            }}
          >
            Avbryt
          </Button>

          <Button onClick={(evt) => {
            evt.preventDefault()

            if (!provider?.document) {
              return
            }

            const yEle = provider.document.getMap('ele')
            const meta = yEle.get('meta') as Y.Map<unknown>
            if (meta.has('core/assignment')) {
              const assignments = meta.get('core/assignment') as Y.Array<unknown>
              assignments.delete(index, 1)
            }
            setSelectedAssignment(undefined)
          }}>
            Ta bort
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
