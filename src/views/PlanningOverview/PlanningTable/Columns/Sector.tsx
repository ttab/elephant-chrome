import { SectorBadge } from '@/components/DataItem/SectorBadge'
import { useMemo } from 'react'

export const Sector = ({ section }: { section: string }): JSX.Element => {
  return useMemo(() => <SectorBadge value={section} />, [section])
}
