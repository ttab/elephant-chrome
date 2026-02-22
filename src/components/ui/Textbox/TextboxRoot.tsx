import type { JSX } from 'react'
import { Textbit } from '@ttab/textbit'
import type * as Y from 'yjs'
import { LocalizedQuotationMarks, Text } from '@ttab/textbit-plugins'
import { TextboxEditable } from './TextboxEditable'
import { useYValue, type YDocument } from '@/modules/yjs/hooks'
import { useOnSpellcheck } from '@/hooks/useOnSpellcheck'
import { cn } from '@ttab/elephant-ui/utils'
import { UniqueEditorOrigin } from '@/components/UniqueEditorOrigin'

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
  onFocus,
  className
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
  className?: string
}): JSX.Element => {
  const [documentLanguage] = useYValue<string>(ydoc.ele, 'root.language')
  const onSpellcheck = useOnSpellcheck(documentLanguage)

  return (
    <Textbit.Root
      value={value}
      lang={documentLanguage}
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
      className={cn('h-min-2 w-full', className)}
    >
      <UniqueEditorOrigin />
      <TextboxEditable
        spellcheck={spellcheck}
        autoFocus={autoFocus}
        onFocus={onFocus}
        onBlur={onBlur}
        singleLine={singleLine}
      />
    </Textbit.Root>
  )
}
