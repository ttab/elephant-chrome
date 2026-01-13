import { useRef, type JSX } from 'react'
import { ComboBox } from '@ttab/elephant-ui'
import { Newsvalues } from '@/defaults'
import { Awareness } from '@/components'
import { Validation } from './Validation'
import type { FormProps } from './Form/Root'
import type * as Y from 'yjs'
import { useYValue, type YDocument } from '@/modules/yjs/hooks'

export const Newsvalue = ({ ydoc, path, onValidation, validateStateRef, onChange }: {
  ydoc: YDocument<Y.Map<unknown>>
  path: string
} & FormProps): JSX.Element => {
  const [newsvalue, setNewsvalue] = useYValue<string | undefined>(ydoc.ele, path)
  const setFocused = useRef<(value: boolean, path: string) => void>(() => { })
  const selectedOptions = Newsvalues.filter((type) => type.value === newsvalue)

  const SelectedIcon = selectedOptions.length && selectedOptions[0].icon

  return (
    <Awareness ref={setFocused} ydoc={ydoc} path={path}>
      <Validation
        ydoc={ydoc}
        label='Nyhetsvärde'
        path={path}
        block='core/newsvalue[0]'
        onValidation={onValidation}
        validateStateRef={validateStateRef}
      >
        <ComboBox
          max={1}
          size='xs'
          modal={true}
          variant='outline'
          options={Newsvalues}
          selectedOptions={selectedOptions}
          placeholder='Lägg till nyhetsvärde'
          validation={!!onValidation}
          onOpenChange={(isOpen: boolean) => {
            setFocused.current(true, isOpen ? path : '')
          }}
          onSelect={(option) => {
            onChange?.(true)
            if (newsvalue === option.value) {
              setNewsvalue(undefined)
            } else {
              setNewsvalue(option.value)
            }
          }}
        >

          {selectedOptions?.[0] && SelectedIcon && (
            <div className='flex'>
              <SelectedIcon {...selectedOptions[0].iconProps} />
              {selectedOptions?.[0]?.label}
            </div>
          )}
        </ComboBox>
      </Validation>
    </Awareness>
  )
}
