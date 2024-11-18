import { useQuery } from '@/hooks'
import { useWireSources } from '@/hooks/useWireSources'
import { ComboBox } from '@ttab/elephant-ui'

export const Sources = (): JSX.Element => {
  const allSources = useWireSources().map((_) => {
    return {
      value: _.uri,
      label: _.title
    }
  })

  const [{ source }, setQuery] = useQuery()

  return (
    <ComboBox
      max={1}
      size='xs'
      sortOrder='label'
      options={allSources}
      selectedOptions={allSources.filter((s) => s.label === source)}
      placeholder='Välj källa'
      onSelect={(option) => {
        if (option.label === source) {
          setQuery({
            source: undefined,
            page: undefined
          })
          return
        }

        setQuery({
          source: option.label,
          page: undefined
        })
      }}
    />
  )
}

