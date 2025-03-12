import { useSections } from '@/hooks/useSections'
import { Shapes } from '@ttab/elephant-ui/icons'
import { Base } from '@/components/Filter/Base'
import { BaseSelected } from '@/components/Filter/BaseSelected'
import type { FilterProps } from '@/components/Filter'

const FILTER_PAGE = 'section'

export const Section = (props: FilterProps): JSX.Element | undefined => {
  const allSections = useSections().map((_) => {
    return {
      value: _.id,
      label: _.title
    }
  })

  if (!props.page) {
    return (
      <Base
        {...props}
        filterPage={FILTER_PAGE}
        label='Sektion'
        Icon={Shapes}
      />
    )
  }

  if (props.page === FILTER_PAGE) {
    return (
      <BaseSelected
        {...props}
        filterPage={FILTER_PAGE}
        options={allSections}
      />
    )
  }
}

