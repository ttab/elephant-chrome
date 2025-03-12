import { Base } from '@/components/Filter/Base'
import { BaseSelected } from '@/components/Filter/BaseSelected'
import type { FilterProps } from '@/components/Filter'
import type { LucideIcon } from '@ttab/elephant-ui/icons'

export const OptionsFilter = (props: FilterProps & {
  options: {
    value: string
    label: string
  }[]
  facets?: Map<string, number>
  filterPage: string
  label: string
  Icon: LucideIcon
}): JSX.Element | undefined => {
  if (!props.page) {
    return (
      <Base
        {...props}
      />
    )
  }

  if (props.page === props.filterPage) {
    return (
      <BaseSelected
        {...props}
      />
    )
  }
}
