import { useYObserver } from '@/hooks/useYObserver'
import { TimeDisplay } from '@/components/DataItem/TimeDisplay'
import { AssignmentType } from '@/components/DataItem/AssignmentType'
import { AssigneeAvatars } from '@/components/DataItem/AssigneeAvatars'
import type * as Y from 'yjs'
import { DotDropdownMenu } from '@/components/ui/DotMenu'
import { useCollaboration, useNavigation, useView } from '@/hooks'
import { Delete, Edit, NotebookPen } from '@ttab/elephant-ui/icons'
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@ttab/elephant-ui'
import { useMemo, useState } from 'react'
import { SluglineButton } from '@/components/DataItem/Slugline'
import { appendArticle } from '@/lib/createYItem'
import { handleLink } from '@/components/Link/lib/handleLink'
import { useYValue } from '@/hooks/useYValue'

export const AssignmentRow = ({ index, setSelectedAssignment }: {
  index: number
  setSelectedAssignment: React.Dispatch<React.SetStateAction<number | undefined>>
}): JSX.Element => {
  const assPath = `meta.core/assignment[${index}]`
  const [inProgress] = useYValue(`${assPath}.__inProgress`)
  // const [uuid] = useYValue<string>(`${assPath}.links.core/article[0]`)
  // const [showCreateDialog, setShowCreateDialog] = useState<boolean>(false)

  if (inProgress) {
    return <></>
  }

  return (
    <div onClick={(ev) => {
      ev.preventDefault()
      ev.stopPropagation()
      setSelectedAssignment(index)
    }}>
      <AssignmentRowContent
        index={index}
        setSelectedAssignment={setSelectedAssignment}
      />
    </div>
  )
  // return (
  //   <>
  //     {uuid
  //       ? (
  //         <Link to='Editor' props={{ id: uuid }} className="group/assrow cursor-default">
  //           <AssignmentRowContent index={index} setSelectedAssignment={setSelectedAssignment} />
  //         </Link>)
  //       : (
  //         <div onClick={() => setShowCreateDialog(true)}>
  //           <AssignmentRowContent
  //             index={index}
  //             setSelectedAssignment={setSelectedAssignment}
  //             setShowCreateDialog={setShowCreateDialog}
  //             showCreateDialog={showCreateDialog}
  //           />
  //         </div>)
  //     }
  //   </>
  // )
}

const AssignmentRowContent = ({ index, setSelectedAssignment /*, setShowCreateDialog, showCreateDialog = false */ }: {
  index: number
  setSelectedAssignment: React.Dispatch<React.SetStateAction<number | undefined>>
  // setShowCreateDialog?: React.Dispatch<React.SetStateAction<boolean>>
  // showCreateDialog?: boolean
}): JSX.Element => {
  const assPath = `meta.core/assignment[${index}]`
  const [inProgress] = useYValue(`${assPath}.__inProgress`)
  const [title] = useYValue<string>(`${assPath}.title`)
  const [description] = useYValue<string>(`${assPath}.meta.core/description[0].data.text`)
  const [publishTime] = useYValue<string>(`${assPath}.data.publish`)

  // FIXME: Convert to use useYValue()
  const { state: stateAuthor = [] } = useYObserver('meta', `core/assignment[${index}].links.core/author`)

  const [showVerifyDialog, setShowVerifyDialog] = useState<boolean>(false)
  const [showCreateDialog, setShowCreateDialog] = useState<boolean>(false)

  const assTime = useMemo(() => {
    return publishTime ? new Date(publishTime) : undefined
  }, [publishTime])

  const defaultMenuItems = [
    {
      label: 'Redigera uppdrag',
      icon: Edit,
      item: (ev: Event) => {
        ev.preventDefault()
        ev.stopPropagation()
        setSelectedAssignment(index)
      }
    },
    {
      label: 'Ta bort',
      icon: Delete,
      item: (ev: Event) => {
        ev.preventDefault()
        ev.stopPropagation()
        setShowVerifyDialog(true)
      }
    }
  ]

  const menuItems = [
    {
      label: 'Öppna artikel',
      icon: NotebookPen,
      item: (ev: Event) => {
        ev.preventDefault()
        ev.stopPropagation()
        // TODO: Add opening article here
        console.warn('Not implemnented')
      }
    },
    ...defaultMenuItems
  ]

  return (
    <div className='flex flex-col gap-2 text-sm px-4 pt-2.5 pb-4 hover:bg-muted'>
      <div className="flex flex-row gap-6 items-center justify-items-between justify-between">

        <div className="flex grow gap-4 items-center">
          <AssignmentType path={`core/assignment[${index}].meta.core/assignment-type`} />
          <AssigneeAvatars assignees={Array.isArray(stateAuthor) ? stateAuthor.map((author) => author.name) : []} />

          <div className="hidden items-center @3xl/view:flex">
            <SluglineButton path={`core/assignment[${index}].meta.tt/slugline[0]`} />
          </div>
        </div>

        <div className="flex grow items-center justify-end">
          <div className="min-w-[64px] whitespace-nowrap">
            {assTime ? <TimeDisplay date={assTime} /> : ''}
          </div>

          {!inProgress &&
            <DotDropdownMenu
              items={menuItems}
            />
          }
        </div>
      </div>

      <div className="text-[15px] font-medium">
        <span className='pr-2 leading-relaxed group-hover/assrow:underline'>{title}</span>
      </div>

      {!!description &&
        <div className='font-light'>
          {description}
        </div>
      }

      {showVerifyDialog &&
        <VerifyDeleteAssignmentDialog
          index={index}
          title={title || ''}
          setSelectedAssignment={setSelectedAssignment}
          setShowVerifyDialog={setShowVerifyDialog}
        />
      }
      {showCreateDialog && setShowCreateDialog &&
        <VerifyCreateArticleDialog
          index={index}
          title={title || ''}
          setSelectedAssignment={setSelectedAssignment}
          setShowCreateDialog={setShowCreateDialog}
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

// TODO: We should really have some general prompt dialog...
const VerifyCreateArticleDialog = ({ index, title, setShowCreateDialog }: {
  index: number
  title: string
  setSelectedAssignment: React.Dispatch<React.SetStateAction<number | undefined>>
  setShowCreateDialog: React.Dispatch<React.SetStateAction<boolean>>
}): JSX.Element => {
  const { provider } = useCollaboration()
  const { state, dispatch } = useNavigation()
  const { viewId: origin } = useView()

  return (
    <Dialog open={true}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Skapa artikel</DialogTitle>
        </DialogHeader>

        <DialogDescription>
          {title
            ? <>Vill du skapa en artikel för uppdraget <em>{title}</em>?</>
            : <>Vill du skapa en artikel uppdraget?</>
          }
        </DialogDescription>

        <DialogFooter className="flex flex-col gap-2 pt-4">
          <Button
            variant="secondary"
            onClick={(evt) => {
              evt.preventDefault()
              evt.stopPropagation()

              setShowCreateDialog(false)
            }}
          >
            Avbryt
          </Button>

          <Button onClick={(evt) => {
            evt.preventDefault()
            evt.stopPropagation()

            if (!provider?.document) {
              return
            }


            const id = crypto.randomUUID()

            const onDocumentCreated = (): void => {
              setTimeout(() => {
                appendArticle({ document: provider?.document, id, index, slug: '' })
              }, 0)
            }
            const props = { id }

            handleLink({
              event: evt,
              dispatch,
              viewItem: state.viewRegistry.get('Editor'),
              viewRegistry: state.viewRegistry,
              props,
              viewId: crypto.randomUUID(),
              origin,
              onDocumentCreated
            })


            setShowCreateDialog(false)
          }}>
            Skapa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
