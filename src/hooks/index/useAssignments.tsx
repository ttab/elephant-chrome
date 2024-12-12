import useSWR from 'swr'
import { BoolQueryV1, QueryV1 } from '@ttab/elephant-api/index'
import { useRegistry } from '../useRegistry'
import { useSession } from 'next-auth/react'
import type { Block } from '@ttab/elephant-api/newsdoc'
import { parseISO, getHours } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

interface AssignmentInterface extends Block {
  _id: string
  _title: string
  _newsvalue?: string
  _section?: string
}

interface AssignmentResponseInterface {
  key?: string
  label?: string
  hours?: number[]
  items: AssignmentInterface[]
}

/**
 * Fetch all assignments in specific date as Block[] extended with some planning level data.
 * Allows optional filtering by type and optional sorting into buckets.
 */
export const useAssignments = ({ date, type, slots }: {
  date: Date | string
  type?: string
  slots?: {
    key: string
    label: string
    hours: number[]
  }[]
}) => {
  const session = useSession()
  const { index, timeZone } = useRegistry()

  const today = new Date(date)
  today.setHours(0, 0, 0, 0)

  const year = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(today)
  const month = new Intl.DateTimeFormat('en', { month: '2-digit' }).format(today)
  const day = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(today)

  const hour = new Intl.DateTimeFormat('en', { hour: '2-digit', hourCycle: 'h23' }).format(today).padStart(2, '0')
  const minute = new Intl.DateTimeFormat('en', { minute: '2-digit' }).format(today).padStart(2, '0')
  const second = new Intl.DateTimeFormat('en', { second: '2-digit' }).format(today).padStart(2, '0')

  const todayFormatted = `${year}-${month}-${day}T${hour}:${minute}:${second}Z`
  const key = type ? `core/assignment/${type}` : 'core/assignment'


  return useSWR(key, async (): Promise<AssignmentResponseInterface[]> => {
    if (!index || !session?.data?.accessToken) {
      return [{
        items: []
      }]
    }

    const size = 100
    let page = 1
    const textAssignments: AssignmentInterface[] = []

    do {
      const { ok, hits, errorMessage } = await index.query({
        accessToken: session.data.accessToken,
        documentType: 'core/planning-item',
        page,
        size,
        query: QueryV1.create({
          conditions: {
            oneofKind: 'bool',
            bool: BoolQueryV1.create({
              must: [
                {
                  conditions: {
                    oneofKind: 'term',
                    term: {
                      field: 'document.meta.core_assignment.data.start_date',
                      value: todayFormatted
                    }
                  }
                },
                {
                  conditions: {
                    oneofKind: 'term',
                    term: {
                      field: 'document.meta.core_planning_item.data.start_date',
                      value: todayFormatted
                    }
                  }
                }
              ]
            })
          }
        })
      })

      if (!ok) {
        throw new Error(errorMessage || 'Unknown error while searching for text assignments')
      }

      hits.forEach((hit) => {
        if (!hit.document) {
          return
        }

        // Extract planning level data
        const { title: _title, meta, links } = hit.document
        const _section = links.find((l) => l.type === 'core/section')?.title
        const _newsvalue = meta?.find((assignmentMeta) => assignmentMeta.type === 'core/newsvalue')?.value

        meta?.forEach((assignmentMeta) => {
          if (assignmentMeta.type !== 'core/assignment') {
            return
          }

          // If type is given, filter out anything but type
          if (type && !assignmentMeta.meta.filter((m) => m.type === 'core/assignment-type' && m.value === type)?.length) {
            return
          }

          textAssignments.push({
            _id: hit.id,
            _title,
            _newsvalue,
            _section,
            ...assignmentMeta
          })
        })
      })

      page = hits?.length === size ? page + 1 : 0
    } while (page)

    // Return one slot with no spec if not slots are wanted
    if (!slots) {
      return [{
        items: textAssignments
      }]
    }

    // Initalize response slots
    const response = slots.map((slot) => {
      return {
        ...slot,
        items: [] as AssignmentInterface[]
      }
    })

    // Put assignments in slots
    textAssignments.forEach((assignment) => {
      let hour: number
      if (assignment.data.publish) {
        hour = getHours(toZonedTime(parseISO(assignment.data.publish), timeZone))
      } else if (assignment.data.publish_slot) {
        hour = parseInt(assignment.data.publish_slot)
      }

      response.forEach((slot) => {
        console.log(hour)
        if (!hour && !slot.hours.length) {
          slot.items.push(assignment)
        } else if (hour && slot.hours.includes(hour)) {
          slot.items.push(assignment)
        }
      })
    }, [])

    return response
  })
}
