import { SectorBadge } from '@/components/DataItem/SectorBadge'
import { EventsSectors } from '@/defaults'
import { useMemo } from 'react'

export const Sector = ({ title }: {
  title: string
}): JSX.Element => {
  return useMemo(() => {
    const sector = EventsSectors.find((sector) => sector?.payload?.title === title)

    if (!sector) {
      return <></>
    }

    return (
      <SectorBadge label={sector.label} color={sector.color} />
    )
  }, [title])
}
