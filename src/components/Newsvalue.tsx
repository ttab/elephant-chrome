import { useRef } from 'react'
import { ComboBox } from '@ttab/elephant-ui'
import { Newsvalues } from '@/defaults'
import { useYValue } from '@/hooks'
import { Awareness } from '@/components'

export const Newsvalue = (): JSX.Element => {
  const [newsvalue, setNewsvalue] = useYValue<string | undefined>('meta.core/newsvalue[0].value')

  const setFocused = useRef<(value: boolean) => void>(null)

  const selectedOptions = Newsvalues.filter(type => {
    return type.value === newsvalue
  })

  const SelectedIcon = selectedOptions.length && selectedOptions[0].icon

  return (
    <Awareness name='Newsvalue' ref={setFocused}>
      <ComboBox
        max={1}
        size='sm'
        modal={true}
        variant={'ghost'}
        options={Newsvalues}
        selectedOptions={selectedOptions}
        onOpenChange={(isOpen: boolean) => {
          if (setFocused?.current) {
            setFocused.current(isOpen)
          }
        }}
        onSelect={(option) => {
          setNewsvalue(option.value)
        }}
        hideInput
      >
        {SelectedIcon
          ? <SelectedIcon { ...selectedOptions[0].iconProps } />
          : selectedOptions?.[0]?.label
          }
      </ComboBox>
    </Awareness>
  )
}
