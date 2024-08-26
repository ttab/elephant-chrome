import { SectionBadge } from '@/components/DataItem/SectionBadge'
import { useSections } from '@/hooks/useSections'
import { useMemo } from 'react'

export const Section = ({ uuid }: {
  uuid: string
}): JSX.Element => {
  const allSections = useSections()

  return useMemo(() => {
    const section = allSections.find((section) => section?.id === uuid)

    if (!section) {
      return <></>
    }

    return (
      <SectionBadge title={section.title} />
    )
  }, [uuid, allSections])
}
