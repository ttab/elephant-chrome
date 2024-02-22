import { SectorBadge } from '@/components/DataItem/SectorBadge'
import { useYObserver } from '@/hooks'
import type * as Y from 'yjs'

export const PlanSector = ({ yArray }: { yArray?: Y.Array<Y.Map<unknown>> }): JSX.Element => {
  const [sector] = useYObserver<string>(yArray, '[0].title')

  return <SectorBadge value={sector} />
}
