import type { LucideIcon } from '@ttab/elephant-ui/icons'
import { Base } from '@/components/Filter/Base'
import type { FilterProps } from '@/components/Filter'

export const TextFilter = (props: FilterProps & {
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
}

