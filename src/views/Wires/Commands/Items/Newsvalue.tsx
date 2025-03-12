import { Newsvalues } from '@/defaults'
import { SignalHigh } from '@ttab/elephant-ui/icons'
import { Base } from '@/components/Filter/Base'
import { BaseSelected } from '@/components/Filter/BaseSelected'
import type { FilterProps } from '@/components/Filter'

const FILTER_PAGE = 'newsvalue'

export const Newsvalue = (props: FilterProps): JSX.Element | undefined => {
  if (!props.page) {
    return (
      <Base
        {...props}
        label='Nyhetsvärde'
        filterPage={FILTER_PAGE}
        Icon={SignalHigh}
      />
    )
  }

  if (props.page === FILTER_PAGE) {
    return (
      <BaseSelected
        {...props}
        options={Newsvalues}
        filterPage={FILTER_PAGE}
      />
    )
  }
}
