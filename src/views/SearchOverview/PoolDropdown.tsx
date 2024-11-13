import { type SetStateAction, useMemo } from 'react'
import { ComboBox } from '@ttab/elephant-ui'
import { useQuery } from '@/hooks/useQuery'

interface DropdownProps {
  pool: string
  setPool: React.Dispatch<SetStateAction<string>>
}

export const pools: { value: string, label: string }[] = [
  { value: 'plannings', label: 'Planeringar' },
  { value: 'events', label: 'Händelser' },
  { value: 'assignments', label: 'Uppdrag' },
  { value: 'articles', label: 'Artiklar' }
]

export const PoolDropdown = ({ pool, setPool }: DropdownProps) => {
  const selected = useMemo(() => pools.filter((p) => p.value === pool), [pool])
  const [query, setQueryString] = useQuery()

  return (
    <ComboBox
      selectedOptions={selected}
      max={1}
      options={pools}
      onSelect={(e) => {
        setPool(e.value)
        setQueryString({ ...query, s: e.value })
      }}
    />
  )
}
