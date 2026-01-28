import { useWireSources } from '@/hooks/useWireSources'
import { SquareCodeIcon } from '@ttab/elephant-ui/icons'
import { FilterBadge } from '../FilterBadge'

export const WireSourceFilterValue = ({ values }: {
  values: string[]
}) => {
  const sources = useWireSources()
  const labels = sources.filter((v) => values.includes(v.uri)).map((v) => v.title)

  return (
    <>
      <SquareCodeIcon size={18} strokeWidth={1.75} className='mr-2' />
      <FilterBadge labels={labels} />
    </>
  )
}
