import { useWireSources } from '@/hooks'
import { Base } from '@/components/Filter/Base'
import { BaseSelected } from '@/components/Filter/BaseSelected'
import { SquareCode } from '@ttab/elephant-ui/icons'
import type { FilterProps } from '@/components/Filter'

const FILTER_PAGE = 'source'

export const Source = (props: FilterProps): JSX.Element | undefined => {
  const allSources = useWireSources().map(({ uri, title }) => ({
    value: uri,
    label: title
  }))

  if (!props.page) {
    return (
      <Base
        {...props}
        label='Källor'
        filterPage={FILTER_PAGE}
        Icon={SquareCode}
      />
    )
  }

  if (props.page === 'source') {
    return (
      <BaseSelected
        {...props}
        options={allSources}
        filterPage={FILTER_PAGE}
      />
    )
  }
}
