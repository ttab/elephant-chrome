import { useEffect } from 'react'
import { SectorBadge } from '@/components/DataItem/SectorBadge'
import { useYMap } from '@/hooks'
import type { CollabComponentProps } from '@/types'
import { type YMap } from 'node_modules/yjs/dist/src/internals'

export const PlanSector = ({ isSynced, document }: CollabComponentProps): JSX.Element => {
  const [sector, , initSector] = useYMap('core/planning-item/sector')

  useEffect(() => {
    if (!isSynced || !document) {
      return
    }

    const planningYMap: YMap<unknown> = document.getMap('planning')
    initSector(planningYMap)
  }, [
    isSynced,
    document,
    initSector
  ])
  return <SectorBadge value={sector as string} />
}
