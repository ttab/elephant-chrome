import { SectorBadge } from '@/components/DataItem/SectorBadge'
import { Sectors } from '@/defaults'
import { useMemo } from 'react'

export const Sector = ({ uuid }: {
  uuid: string
}): JSX.Element => {
  return useMemo(() => {
    const sector = Sectors.find((sector) => sector.value === uuid)

    if (!sector) {
      return <></>
    }

    return (
      <SectorBadge label={sector.label} color={sector.color} />
    )
  }, [uuid])
}
