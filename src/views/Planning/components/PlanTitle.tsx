import { useEffect } from 'react'
import { useYMap } from '@/hooks'
import { type CollabComponentProps } from '@/types'
import { Input } from '@ttab/elephant-ui'
import { cn } from '@ttab/elephant-ui/utils'
import { type YMap } from 'node_modules/yjs/dist/src/internals'

export const PlanTitle = ({ isSynced, document, className }: CollabComponentProps): JSX.Element | null => {
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
