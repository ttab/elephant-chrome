import { Link } from '@/components'
import { useYObserver } from '@/hooks/useYObserver'
import { TimeDisplay } from '@/components/DataItem/TimeDisplay'
import { SluglineEditable } from '@/components/DataItem/Slugline'
import { AssignmentType } from '@/components/DataItem/AssignmentType'
import { AssigneeAvatars } from '@/components/DataItem/AssigneeAvatars'
import type * as Y from 'yjs'
import { DotDropdownMenu } from '@/components/ui/DotMenu'
import { useCollaboration } from '@/hooks'


export const AssignmentRow = ({ index, setSelectedAssignment }: {
  index: number
  setSelectedAssignment: React.Dispatch<React.SetStateAction<number | undefined>>
}): JSX.Element => {
  const { provider } = useCollaboration()
  const { get: getTitle } = useYObserver('meta', `core/assignment[${index}]`)
  const { get: getUUID } = useYObserver('meta', `core/assignment[${index}].links.core/article[0]`)
  const { get: getAssignmentDescription } = useYObserver('meta', `core/assignment[${index}].meta.core/description[0].data`)
  const { get: getAssignmentPublishTime } = useYObserver('meta', `core/assignment[${index}].data`)
  const { state: stateAuthor = [] } = useYObserver('meta', `core/assignment[${index}].links.core/author`)

  return (
    <div className="grid grid-cols-12 border-b py-2">

      <div className="col-span-8 px-2 py-1">
        <div className="flex-grow flex space-x-2 items-center">
          <div className='font-medium text-sm'>
            {getUUID('uuid')
              ? <Link to='Editor' props={{ id: getUUID('uuid') as string }}>
                {(getTitle('title') as Y.XmlText)?.toJSON()}
              </Link>
              : <span className='text-muted-foreground'>{(getTitle('title') as Y.XmlText)?.toJSON()}</span>}
          </div>

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
          <DotDropdownMenu
            items={[
              {
                label: 'Edit',
                item: () => {
                  setSelectedAssignment(index)
                }
              },
              {
                label: 'Remove',
                item: () => {
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
                }
              }
            ]}
          />
        </div>
      </div>

    </div>
  )
}
