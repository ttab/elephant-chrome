import { Awareness } from '@/components'
import { ComboBox } from '@/components/ui'
import { PlanningSections } from '@/defaults'
// import { useYObserver } from '@/hooks'
import { useYValue } from '@/hooks/useYValue'
import { cn } from '@ttab/elephant-ui/utils'
import { useRef } from 'react'
import { type Block } from '@/protos/service'

export const PlanSector = (): JSX.Element | undefined => {
  const [section, setSection] = useYValue<Block | undefined>('links.tt/sector[0]')
  const setFocused = useRef<(value: boolean) => void>(null)
  const uuid = section?.uuid
  const selectedOption = PlanningSections.find(c => c.value === uuid)

  const placeholder = selectedOption?.label || 'Add Section'

  return (
    <Awareness name='PlanSection' ref={setFocused}>
      <ComboBox
        size='xs'
        className='w-fit text-muted-foreground font-sans font-normal whitespace-nowrap text-ellipsis px-2 h-7'
        options={PlanningSections}
        selectedOption={selectedOption}
        placeholder={placeholder}
        onOpenChange={(isOpen: boolean) => {
          if (setFocused?.current) {
            setFocused.current(isOpen)
          }
        }}
        onSelect={(option) => {
          setSection(option.payload)
        }}
      >
        {selectedOption?.color && <div className={cn('h-2 w-2 rounded-full mr-2', selectedOption?.color)} />}
        {selectedOption ? <>{selectedOption.label}</> : <>{placeholder}</>}
      </ComboBox>
    </Awareness>
  )
}
