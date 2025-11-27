import { Textbit } from '@ttab/textbit'
import type * as Y from 'yjs'
import { LocalizedQuotationMarks, Text } from '@ttab/textbit-plugins'
import { TextboxEditable } from './TextboxEditable'
import { useYPath, useYValue, type YDocument } from '@/modules/yjs/hooks'
import { useOnSpellcheck } from '@/hooks/useOnSpellcheck'

export const TextboxRoot = ({
  value,
  ydoc,
  disabled,
  placeholder,
  singleLine = false,
  countCharacters = false,
  autoFocus,
  spellcheck = true,
  onBlur,
  onFocus
}: {
  value: Y.XmlText
  ydoc: YDocument<Y.Map<unknown>>
  disabled?: boolean
  placeholder?: string
  singleLine?: boolean
  autoFocus?: boolean
  countCharacters?: boolean
  spellcheck?: boolean
  onBlur: React.FocusEventHandler<HTMLDivElement>
  onFocus: React.FocusEventHandler<HTMLDivElement>
}): JSX.Element => {
  const path = useYPath(value, true)
  const [documentLanguage] = useYValue<string>(ydoc.ele, ['root', 'language'])
  const onSpellcheck = useOnSpellcheck(documentLanguage)

  return (
    <Textbit.Root
      value={value}
      awareness={ydoc.provider?.awareness}
      cursor={{
        autoSend: false,
        dataField: 'data',
        data: ydoc.user as Record<string, unknown>,
        stateField: path
      }}
      debounce={0}
      onSpellcheck={spellcheck ? onSpellcheck : undefined}
      readOnly={disabled}
      placeholder={placeholder}
      plugins={[
        LocalizedQuotationMarks(),
        Text({
          singleLine,
          countCharacters,
          classNames: {
            body: 'font-sans py-0'
          }
        })
      ]}
      className='h-min-2 w-full'
    >
      <TextboxEditable
        documentLanguage={documentLanguage}
        spellcheck={spellcheck}
        autoFocus={autoFocus}
        onFocus={onFocus}
        onBlur={onBlur}
        singleLine={singleLine}
      />
    </Textbit.Root>
  )
}
