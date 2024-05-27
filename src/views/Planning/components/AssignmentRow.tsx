import { Link } from '@/components'
import { useYObserver } from '@/hooks/useYObserver'
import { TimeDisplay } from '@/components/DataItem/TimeDisplay'
import { AssignmentType } from '@/components/DataItem/AssignmentType'
import { AssigneeAvatars } from '@/components/DataItem/AssigneeAvatars'
import type * as Y from 'yjs'
import { DotDropdownMenu } from '@/components/ui/DotMenu'
import { useCollaboration } from '@/hooks'
import { Delete, Edit } from '@ttab/elephant-ui/icons'
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@ttab/elephant-ui'
import { useState } from 'react'
import { SluglineButton } from '@/components/DataItem/Slugline'

export const AssignmentRow = ({ index, setSelectedAssignment }: {
  index: number
  setSelectedAssignment: React.Dispatch<React.SetStateAction<number | undefined>>
}): JSX.Element => {
  const { get } = useYObserver('meta', `core/assignment[${index}]`)
  const { get: getUUID } = useYObserver('meta', `core/assignment[${index}].links.core/article[0]`)

  const uuid = getUUID('uuid')
  const inProgress = !!get('__inProgress')

  return (
    <>
      {uuid && !inProgress
        ? <Link to='Editor' props={{ id: uuid as string }} className="group/assrow cursor-default">
          <AssignmentRowContent index={index} setSelectedAssignment={setSelectedAssignment} />
        </Link>
        : <AssignmentRowContent index={index} setSelectedAssignment={setSelectedAssignment} />
      }
    </>
  )
}

const AssignmentRowContent = ({ index, setSelectedAssignment }: {
  index: number
  setSelectedAssignment: React.Dispatch<React.SetStateAction<number | undefined>>
}): JSX.Element => {
  const { get } = useYObserver('meta', `core/assignment[${index}]`)
  const { get: getUUID } = useYObserver('meta', `core/assignment[${index}].links.core/article[0]`)
  const { get: getAssignmentDescription } = useYObserver('meta', `core/assignment[${index}].meta.core/description[0].data`)
  const { get: getAssignmentPublishTime } = useYObserver('meta', `core/assignment[${index}].data`)
  const { state: stateAuthor = [] } = useYObserver('meta', `core/assignment[${index}].links.core/author`)
  const [showVerifyDialog, setShowVerifyDialog] = useState<boolean>(false)

  const uuid = getUUID('uuid')
  const description = (getAssignmentDescription('text') as Y.XmlText)?.toJSON()
  const inProgress = !!get('__inProgress')

  return (
    <div className='flex flex-col text-sm px-4 py-2.5 @4xl/view:gap-1 hover:bg-muted'>
      <div className='grid grid-cols-12 grid-rows-2 text-sm gap-2 items-start @4xl/view:grid-rows-1'>

        <div className='row-start-1 col-start-1 col-span-10 row-span-1 self-center text-[15px] font-medium @4xl/view:col-span-8 @4xl/view:pt-1'>
          {uuid && !inProgress
            ? <span className='pr-2 leading-relaxed group-hover/assrow:underline'>{(get('title') as Y.XmlText)?.toJSON()}</span>
            : <span className='pr-2 leading-relaxed text-muted-foreground'>{(get('title') as Y.XmlText)?.toJSON()}</span>
          }

          <span className="float-right pr-4">
            <SluglineButton path={`core/assignment[${index}].meta.tt/slugline[0]`} />
          </span>
        </div>

        <div className='row-start-1 col-start-11 col-span-2 row-span-2 justify-self-end @4xl/view:col-start-12 @4xl/view:col-span-1'>
          {!inProgress &&
            <DotDropdownMenu
              items={[
                {
                  label: 'Redigera',
                  icon: Edit,
                  item: (ev) => {
                    ev.preventDefault()
                    ev.stopPropagation()
                    setSelectedAssignment(index)
                  }
                },
                {
                  label: 'Ta bort',
                  icon: Delete,
                  item: (ev) => {
                    ev.preventDefault()
                    ev.stopPropagation()
                    setShowVerifyDialog(true)
                  }
                }
              ]}
            />
          }
        </div>

        <div className='row-start-2 col-start-1 col-span-10 row-span-1 flex space-x-2 items-center pt-0.5 @4xl/view:row-start-1 @4xl/view:col-span-3 @4xl/view:col-start-9 pb-2 @4xl/view:pb-0'>
          <div className="pr-4 @4xl/view:px-4">
            <AssignmentType path={`core/assignment[${index}].meta.core/assignment-type`} />
          </div>

          <div className="min-w-[64px] whitespace-nowrap">
            {getAssignmentPublishTime('publish')
              ? <TimeDisplay date={new Date(getAssignmentPublishTime('publish') as string)} />
              : ''
            }
          </div>
          <div className='min-w-[128px] whitespace-nowrap -ml-1 @4xl/view:ml-0 hover:cursor-default'>
            <AssigneeAvatars assignees={Array.isArray(stateAuthor) ? stateAuthor.map((author) => author.name) : []} />
          </div>

        </div>

      </div>{/* end of grid */}

      {!!description &&
        <div className='grid grid-cols-12 font-light'>
          <div className='col-start-1 col-span-12 pb-2 @xl/view:col-span-11 @4xl/view:col-span-8'>
            {description}
          </div>
        </div>
      }

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
