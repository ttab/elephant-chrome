import { Binoculars } from '@ttab/elephant-ui/icons'
import { Base } from '@/components/Filter/Base'
import type { FilterProps } from '@/components/Filter'

const FILTER_PAGE = 'query'

export const Text = ({ page, pages, setPages, search, setSearch }: FilterProps): JSX.Element | undefined => {
  if (!page) {
    return (
      <Base
        search={search}
        page={page}
        pages={pages}
        filterPage={FILTER_PAGE}
        setPages={setPages}
        setSearch={setSearch}
        label='Fritext'
        Icon={Binoculars}
      />
    )
  }
}

