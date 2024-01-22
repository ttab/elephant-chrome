import { useYMap } from '@/hooks'
import { type PlanningComponentProps } from '@/types'
import { Input } from '@ttab/elephant-ui'
import { type YMap } from 'node_modules/yjs/dist/src/internals'
import { useEffect } from 'react'
import { cn } from '@ttab/elephant-ui/utils'

export const PlanTitle = ({ isSynced, document, className }: PlanningComponentProps): JSX.Element | null => {
  const [title = '', setTitle, initTitle] = useYMap('core/planning-item/title')

  useEffect(() => {
    if (!isSynced || !document) {
      return
    }

    const planningYMap: YMap<unknown> = document.getMap('planning')
    initTitle(planningYMap)
  }, [
    isSynced,
    document,
    initTitle
  ])

  return (
    <Input
      value={title as string}
      className={cn('font-medium text-sm border-0', className)}
      onChange={(event) => setTitle(event.target.value)}
    />
  )
}
