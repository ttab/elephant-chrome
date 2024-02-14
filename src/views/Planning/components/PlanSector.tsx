import { SectorBadge } from '@/components/DataItem/SectorBadge'
import { useYObserver } from '@/hooks'
import type * as Y from 'yjs'

export const PlanSector = ({ yMap }: { yMap?: Y.Map<unknown> }): JSX.Element => {
  const [sector] = useYObserver<string>(yMap, 'title')

  return <SectorBadge value={sector} />
}
