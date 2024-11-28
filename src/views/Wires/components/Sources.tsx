import { useQuery, useWireSources } from '@/hooks'
import { ComboBox, DefaultValueOption } from '@ttab/elephant-ui'

export const Sources = (): JSX.Element => {
  const allSources = useWireSources().map(({ uri, title }) => ({
    value: uri,
    label: title
  }))

  const [{ source }, setQuery] = useQuery()

  const getSelectedOptions = () => {
    if (Array.isArray(source)) {
      return source
        .map((s) =>
          allSources.find(({ label }) => label === s))
        .filter((x): x is {
          value: string
          label: string
        } => x !== undefined)
    }

    return allSources
      .filter(({ label }) => label === source)
  }

  const handleSelect = (option: DefaultValueOption) => {
    const isSelected = getSelectedOptions()
      .some(({ label }) => label === option.label)

    const newSource = isSelected
      ? getSelectedOptions()
        .filter(({ label }) => label !== option.label)
        .map(({ label }) => label)
      : Array.from(new Set([
        ...getSelectedOptions()
          .map(({ label }) => label),
        option.label]))

    setQuery({
      source: newSource.length
        ? newSource
        : undefined,
      page: undefined
    })
  }

  return (
    <ComboBox
      max={3}
      hideInput
      size='xs'
      sortOrder='label'
      options={allSources}
      selectedOptions={getSelectedOptions()}
      placeholder='Välj källa'
      onSelect={handleSelect}
    />
  )
}
