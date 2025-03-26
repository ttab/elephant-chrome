import { useRegistry } from '@/hooks/useRegistry'
import { fetch } from '@/lib/index/fetch-plannings-twirp'
import type { DefaultValueOption } from '@ttab/elephant-ui'
import { Button, ComboBox, Input } from '@ttab/elephant-ui'
import { ArrowRightLeft, BriefcaseBusiness, Calendar, CircleXIcon, GanttChartSquare } from '@ttab/elephant-ui/icons'
import { useSession } from 'next-auth/react'
import { useMemo, useState } from 'react'
import type { Doc } from 'yjs'
import { View, ViewHeader } from '../View'
import type { ViewProps } from '@/types/index'
import { Form } from '../Form'
import { UserMessage } from '../UserMessage'
import { MovePrompt } from './Prompt'
import type * as Y from 'yjs'
import { deleteByYPath, getValueByYPath, setValueByYPath, toYStructure } from '@/lib/yUtils'
import { Block } from '@ttab/elephant-api/newsdoc'
import { toast } from 'sonner'
import { ToastAction } from '@/views/Wire/ToastAction'
import { createPayload } from '@/defaults/templates/lib/createPayload'
import { DatePicker } from '../Datepicker'
import { currentDateInUTC, parseDate } from '@/lib/datetime'

export const Move = (props: ViewProps & {
  original: {
    document: Doc | undefined
    assignmentId: string | undefined
    assignmentTitle: string | undefined
    assignment: Y.Map<unknown> | undefined
    planningId: string | undefined
  }
}): JSX.Element => {
  const [selectedPlanning, setSelectedPlanning] = useState<DefaultValueOption | undefined>(undefined)
  const [showVerifyDialog, setShowVerifyDialog] = useState(false)
  const [planningDateString, setPlanningDateString] = useState<string | undefined>()

  const date = planningDateString ? parseDate(planningDateString) || new Date() : new Date()

  const { data: session } = useSession()
  const { index } = useRegistry()

  const handleSubmit = (): void => {
    setShowVerifyDialog(true)
  }

  const payload = useMemo(() => {
    if (props.original.document) {
      return createPayload(props.original.document)
    }
  }, [props.original.document])

  return (
    <View.Root asDialog={props.asDialog} className={props.className}>
      <ViewHeader.Root>
        <ViewHeader.Content>
          {props.asDialog && (
            <div className='flex w-full h-full items-center space-x-2 font-bold'>
              <ViewHeader.Title name='Assignment' title='Flytta uppdrag' icon={ArrowRightLeft} iconColor='#006bb3' />
            </div>
          )}
        </ViewHeader.Content>

        <ViewHeader.Action onDialogClose={props.onDialogClose}>
          {!props.asDialog && !!props.id
          && <ViewHeader.RemoteUsers documentId={props.id} />}
        </ViewHeader.Action>
      </ViewHeader.Root>

      <View.Content>
        <Form.Root asDialog={props.asDialog}>
          <Form.Content>
            <Form.Group icon={BriefcaseBusiness}>
              <>
                <Input
                  className='pl-0 pt-2 h-8 text-medium border-0 truncate'
                  readOnly
                  value={props.original.assignmentTitle}
                />
              </>
            </Form.Group>
            <Form.Group icon={GanttChartSquare}>
              <ComboBox
                max={1}
                size='xs'
                className='min-w-0 w-full truncate justify-start max-w-48'
                selectedOptions={selectedPlanning ? [selectedPlanning] : []}
                placeholder='Välj planering'
                fetch={(query) => fetch(query, session, index)
                  .then((data) =>
                    data.filter((item) => item.value !== props.original.planningId)
                  )}
                minSearchChars={2}
                onSelect={(option) => {
                  if (setSelectedPlanning) {
                    if (option.value !== selectedPlanning?.value) {
                      setSelectedPlanning({
                        value: option.value,
                        label: option.label
                      })
                    } else {
                      setSelectedPlanning(undefined)
                    }
                  }
                }}
              >
              </ComboBox>

              {!!selectedPlanning
              && (
                <>
                  <Button
                    variant='ghost'
                    asChild
                    className='text-muted-foreground flex size-4 p-0 data-[state=open]:bg-muted hover:bg-accent2'
                    onClick={(e) => {
                      e.preventDefault()
                      if (setSelectedPlanning) {
                        setSelectedPlanning(undefined)
                      }
                    }}
                  >
                    <CircleXIcon size={18} strokeWidth={1.75} />
                  </Button>
                </>
              )}
            </Form.Group>
            <UserMessage asDialog={!!props?.asDialog}>
              {!selectedPlanning
                ? (
                    <div className='flex flex-col gap-4'>
                      Väljer du ingen planering kommer en ny planering med detta uppdrag att skapas åt dig på valt datum.
                      <Form.Group icon={Calendar}>
                        <DatePicker date={date} setDate={(value) => setPlanningDateString(value)} />
                      </Form.Group>
                    </div>
                  )
                : (
                    <>Detta uppdrag kommer läggas i den valda planeringen</>
                  )}
            </UserMessage>
          </Form.Content>

          {
            showVerifyDialog
            && (
              <MovePrompt
                title='Flytta uppdrag'
                description='Är du säker på att du vill flytta uppdraget?'
                selectedPlanning={selectedPlanning}
                payload={{
                  ...payload,
                  meta: {
                    ...payload?.meta,
                    'core/planning-item': [
                      Block.create({
                        type: 'core/planning-item',
                        data: {
                          public: 'true',
                          tentative: 'false',
                          start_date: planningDateString || currentDateInUTC(),
                          end_date: planningDateString || currentDateInUTC()
                        }
                      })
                    ]
                  }
                }}
                onPrimary={(planning: Y.Doc | undefined) => {
                  try {
                  // We need original planning and a new planning to move the assignment
                    if (!props.original || !props.original.document || !planning) {
                      console.error('Original planning or new planning is missing', !!props.original?.document, !!planning)
                      return
                    }

                    // Get original assignment
                    const yRootOriginal = props.original.document.getMap('ele')
                    const [originalAssignmentArray] = getValueByYPath<Block[] | undefined>(yRootOriginal, 'meta.core/assignment')
                    const originalAssignmentIndex = (originalAssignmentArray || []).findIndex(
                      (assignment: Block) => assignment.id === props.original.assignmentId
                    )

                    if (originalAssignmentIndex < 0) {
                      toast.error('Uppdraget kunde inte flyttas')
                      return
                    }

                    const [originalAssignment] = getValueByYPath<Block>(yRootOriginal, `meta.core/assignment[${originalAssignmentIndex}]`)

                    if (!originalAssignment) {
                      toast.error('Uppdraget kunde inte flyttas')
                      return
                    }
                    const payload = {
                      ...originalAssignment,
                      data: {
                        ...originalAssignment.data,
                        start_date: planningDateString,
                        end_date: planningDateString,
                        start: originalAssignment.data.start
                          ? originalAssignment.data.start.replace(/\d{4}-d{2}-d{2}/, planningDateString || currentDateInUTC())
                          : ''
                      }
                    }

                    // Prepare new planning for assignment
                    const newEle = planning.getMap('ele')
                    const [newAssignmentArray] = getValueByYPath<Block[] | undefined>(newEle, 'meta.core/assignment')
                    const newAssignmentIndex = (newAssignmentArray?.length || 0)

                    const success = setValueByYPath(newEle, `meta.core/assignment[${newAssignmentIndex}]`, toYStructure(payload))

                    if (!success) {
                      toast.error('Uppdraget kunde inte flyttas')
                      return
                    }

                    // Remove from old planning
                    deleteByYPath(yRootOriginal, `meta.core/assignment[${originalAssignmentIndex}]`)

                    const [newPlanningUUID] = getValueByYPath<string>(newEle, 'root.uuid')
                    toast.success('Uppdraget har flyttats', {
                      action: <ToastAction planningId={newPlanningUUID} />
                    })
                    setShowVerifyDialog(false)
                    if (props.onDialogClose) {
                      props.onDialogClose()
                    }
                  } catch (error) {
                    console.error('Error moving assignment', error)
                    toast.error('Uppdraget kunde inte flyttas')
                  }
                }}
                onSecondary={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  setShowVerifyDialog(false)
                }}
                primaryLabel='Flytta'
                secondaryLabel='Avbryt'
              />
            )
          }
          <Form.Footer>
            <Form.Submit
              onSubmit={handleSubmit}
            >
              <div className='flex justify-end'>
                <Button type='submit'>Flytta uppdrag</Button>
              </div>
            </Form.Submit>
          </Form.Footer>
        </Form.Root>
      </View.Content>
    </View.Root>
  )
}
