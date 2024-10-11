import { Awareness } from '@/components'
import { ComboBox } from '@ttab/elephant-ui'
import { useSections, useYValue } from '@/hooks'
import { Block } from '@ttab/elephant-api/newsdoc'
import { useRef } from 'react'
import { Validation } from './Validation'

export const Section = ({ onValidation }: {
  onValidation?: (block: string, label: string, value: string | undefined, reason: string) => boolean
}): JSX.Element => {
  const allSections = useSections().map((_) => {
    return {
      value: _.id,
      label: _.title
    }
  })
  const path = 'links.core/section[0]'

  const [section, setSection] = useYValue<Block | undefined>(path)

  const setFocused = useRef<(value: boolean) => void>(null)
  const selectedOptions = (allSections || [])?.filter(s => s.value === section?.uuid)

  return (
    <Awareness name='Section' ref={setFocused} className='flex flex-col gap-2'>
      <ComboBox
        max={1}
        size='xs'
        modal={true}
        sortOrder='label'
        options={allSections}
        selectedOptions={selectedOptions}
        placeholder={section?.title || 'Lägg till sektion'}
        onOpenChange={(isOpen: boolean) => {
          if (setFocused?.current) {
            setFocused.current(isOpen)
          }
        }}
        onSelect={(option) => {
          if (section?.title === option.label) {
            setSection(undefined)
          } else {
            setSection(Block.create({
              type: 'core/section',
              rel: 'section',
              uuid: option.value,
              title: option.label
            }))
          }
        }}
      />
      {onValidation &&
        <Validation
          label='Sektion'
          path={path}
          block='core/section[0]'
          onValidation={onValidation}
        />
      }
    </Awareness>
  )
}
