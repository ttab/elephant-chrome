import { SectorBadge } from '@/components/DataItem/SectorBadge'
import { CalendarSectors } from '@/defaults'
import { useMemo } from 'react'

export const Sector = ({ title }: {
  title: string
}): JSX.Element => {
  return useMemo(() => {
    const sector = CalendarSectors.find((sector) => sector?.payload?.title === title)

    if (!sector) {
      return <></>
    }

    return (
      <SectorBadge label={sector.label} color={sector.color} />
    )
  }, [title])
}
