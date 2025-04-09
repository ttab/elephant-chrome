import { Textbit } from '@ttab/textbit'
import { useCollaboration } from '@/hooks'
import type * as Y from 'yjs'
import { LocalizedQuotationMarks, Text } from '@ttab/textbit-plugins'
import { useYValue } from '@/hooks/useYValue'
import { TextboxEditable } from './TextboxEditable'

export const TextboxRoot = ({
  disabled,
  placeholder,
  path,
  singleLine = false,
  countCharacters = false,
  autoFocus = false,
  spellcheck = true,
  onBlur,
  onFocus
}: {
  disabled?: boolean
  path: string
  placeholder?: string
  singleLine?: boolean
  autoFocus?: boolean
  countCharacters?: boolean
  spellcheck?: boolean
  onBlur: React.FocusEventHandler<HTMLDivElement>
  onFocus: React.FocusEventHandler<HTMLDivElement>
}): JSX.Element => {
  const { provider, user } = useCollaboration()
  // FIXME: We need to check that the path exists. If not we need to create the missing Block
  const [content] = useYValue<Y.XmlText>(path, true)

  if (!provider?.document || content === undefined) {
    return (
      <div className='h-10 w-full'></div>
    )
  }

  return (
    <>
      {!!provider && content
      && (
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
            content={content}
            provider={provider}
            path={path}
            singleLine={singleLine}
            user={user}
            spellcheck={spellcheck}
          />
        </Textbit.Root>
      )}
    </>
  )
}
