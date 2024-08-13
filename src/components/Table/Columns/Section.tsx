import { SectionBadge } from '@/components/DataItem/SectionBadge'
import { Sections } from '@/defaults'
import { useMemo } from 'react'

export const Section = ({ uuid }: {
  uuid: string
}): JSX.Element => {
  return useMemo(() => {
    const section = Sections.find((section) => section?.payload?.uuid === uuid)

    if (!section) {
      return <></>
    }

    return (
      <SectionBadge label={section.label} color={section.color} />
    )
  }, [uuid])
}
