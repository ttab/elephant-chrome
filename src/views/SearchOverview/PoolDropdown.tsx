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
  const [, setQueryString] = useQuery()

  return (
    <ComboBox
      selectedOptions={selected}
      placeholder={pools.find((p) => p.value === pool)?.label}
      max={1}
      options={pools}
      onSelect={(e) => {
        setPool(e.value)
        setQueryString({ type: e.value })
      }}
    />
  )
}
