import { ComboBox } from '@ttab/elephant-ui'
import { SetStateAction, useMemo } from 'react'

interface DropdownProps {
  pool: string
  setPool: React.Dispatch<SetStateAction<string>>
}

export const PoolDropdown = ({ pool, setPool }: DropdownProps) => {
  const pools: { value: string, label: string }[] = useMemo(() => [
    { value: 'plannings', label: 'Planeringar' },
    { value: 'events', label: 'Händelser' },
    { value: 'assignments', label: 'Uppdrag' },
    { value: 'articles', label: 'Artiklar' }
  ], [])

  const selected = useMemo(() => pools.filter(p => p.value === pool), [pool])

  return (
    <ComboBox
      selectedOptions={selected}
      max={1}
      options={pools}
      onSelect={(e) => {
        setPool(e.value)
      }}
    />
  )
}