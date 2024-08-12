import { SectionBadge } from '@/components/DataItem/SectionBadge'
import { EventsSections } from '@/defaults'
import { useMemo } from 'react'

export const Section = ({ title }: {
  title: string
}): JSX.Element => {
  return useMemo(() => {
    const section = EventsSections.find((section) => section?.payload?.title === title)

    if (!section) {
      return <></>
    }

    return (
      <SectionBadge label={section.label} color={section.color} />
    )
  }, [title])
}
