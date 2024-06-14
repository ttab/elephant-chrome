import { SectorBadge } from '@/components/DataItem/SectorBadge'
import { PlanningSectors } from '@/defaults'
import { useMemo } from 'react'

export const Sector = ({ uuid }: {
  uuid: string
}): JSX.Element => {
  return useMemo(() => {
    const sector = PlanningSectors.find((sector) => sector.value === uuid)

    if (!sector) {
      return <></>
    }

    return (
      <SectorBadge label={sector.label} color={sector.color} />
    )
  }, [uuid])
}
