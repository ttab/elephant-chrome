import type { LucideIcon } from '@ttab/elephant-ui/icons'
import { Base } from '@/components/Filter/Base'
import type { FilterProps } from '@/components/Filter'
import type { JSX } from 'react'

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
