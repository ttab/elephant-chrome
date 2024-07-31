import { SectionBadge } from '@/components/DataItem/SectionBadge'
import { PlanningSections } from '@/defaults'
import { useMemo } from 'react'

export const Section = ({ uuid }: {
  uuid: string
}): JSX.Element => {
  return useMemo(() => {
    const section = PlanningSections.find((section) => section.value === uuid)

    if (!section) {
      return <></>
    }

    return (
      <SectionBadge label={section.label} color={section.color} />
    )
  }, [uuid])
}
