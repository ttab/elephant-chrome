import { Awareness } from '@/components'
import { ComboBox } from '@ttab/elephant-ui'
import { useSections, useYValue } from '@/hooks'
import { Block } from '@ttab/elephant-api/newsdoc'
import { useRef } from 'react'
import { Validation } from './Validation'
import { type FormProps } from './Form/Root'

interface SectionProps {
  onSelect?: (selectedOption: {
    type: string
    rel: string
    uuid: string
    title: string
  }) => void
}

export const Section = ({ onValidation, validateStateRef, onChange, onSelect }:
  FormProps & SectionProps): JSX.Element => {
  const allSections = useSections().map((_) => {
    return {
      value: _.id,
      label: _.title
    }
  })
  const path = 'links.core/section[0]'
  const [section, setSection] = useYValue<Block | undefined>(path)
  const setFocused = useRef<(value: boolean, path: string) => void>(() => { })
  const selectedOptions = (allSections || [])?.filter((s) => s.value === section?.uuid)

  return (
    <Awareness ref={setFocused} path={path}>
      <Validation
        label='Sektion'
        path={path}
        block='core/section[0]'
        onValidation={onValidation}
        validateStateRef={validateStateRef}
      >
        <ComboBox
          max={1}
          size='xs'
          modal={true}
          sortOrder='label'
          options={allSections}
          selectedOptions={selectedOptions}
          placeholder={section?.title || 'Lägg till sektion'}
          validation={!!onValidation}
          onOpenChange={(isOpen: boolean) => {
            if (setFocused?.current) {
              setFocused.current(true, (isOpen) ? path : '')
            }
          }}
          onSelect={(option) => {
            const value = {
              type: 'core/section',
              rel: 'section',
              uuid: option.value,
              title: option.label
            }

            onChange?.(true)

            if (onSelect) {
              onSelect(value)
            }

            if (section?.title === option.label) {
              setSection(undefined)
            } else {
              setSection(Block.create(value))
            }
          }}
        />
      </Validation>
    </Awareness>
  )
}
