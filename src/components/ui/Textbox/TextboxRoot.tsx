import { Textbit } from '@ttab/textbit'
import type * as Y from 'yjs'
import { LocalizedQuotationMarks, Text } from '@ttab/textbit-plugins'
import { TextboxEditable } from './TextboxEditable'
import type { YDocument } from '@/modules/yjs/hooks'

export const TextboxRoot = ({
  value,
  ydoc,
  disabled,
  placeholder,
  singleLine = false,
  countCharacters = false,
  autoFocus = false,
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
  return (
    <Textbit.Root
      debounce={0}
      autoFocus={autoFocus}
      onBlur={onBlur}
      onFocus={onFocus}
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
        disabled={disabled}
        value={value}
        ydoc={ydoc}
        singleLine={singleLine}
        spellcheck={spellcheck}
      />
    </Textbit.Root>
  )
}
