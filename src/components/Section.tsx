import { Awareness } from '@/components'
import { ComboBox } from '@ttab/elephant-ui'
import { useSections } from '@/hooks'
import { Block } from '@ttab/elephant-api/newsdoc'
import { useRef, type JSX } from 'react'
import { Validation } from './Validation'
import { type FormProps } from './Form/Root'
import { type YDocument, useYValue } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'
import { useTranslation } from 'react-i18next'

interface SectionProps {
  onSelect?: (selectedOption: {
    type: string
    rel: string
    uuid: string
    title: string
  }) => void
}

export const Section = ({ ydoc, path, onValidation, validateStateRef, onChange, onSelect }: {
  ydoc: YDocument<Y.Map<unknown>>
  path: string
} & FormProps & SectionProps): JSX.Element => {
  const { t } = useTranslation('event')
  const allSections = useSections().map((_) => {
    return {
      value: _.id,
      label: _.title
    }
  })
  const [section, setSection] = useYValue<Block | undefined>(ydoc.ele, path)
  const setFocused = useRef<(value: boolean, path: string) => void>(() => { })
  const selectedOptions = (allSections || [])?.filter((s) => s.value === section?.uuid)

  return (
    <Awareness ref={setFocused} ydoc={ydoc} path={path}>
      <Validation
        ydoc={ydoc}
        label={t('core:labels.section')}
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
          placeholder={section?.title || t('event:placeholders.addSection')}
          validation={!!onValidation}
          onOpenChange={(isOpen: boolean) => {
            setFocused.current(true, (isOpen) ? path : '')
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
          translationStrings={{
            searching: t('common:misc.searching'),
            nothingFound: t('common:misc.nothingFound')
          }}
        />
      </Validation>
    </Awareness>
  )
}
