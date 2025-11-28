import { Textbit } from '@ttab/textbit'
import { cn } from '@ttab/elephant-ui/utils'
import { ContextMenu } from '../../Editor/ContextMenu'

export const TextboxEditable = ({ documentLanguage, singleLine, autoFocus, onFocus, onBlur }: {
  singleLine: boolean
  documentLanguage?: string
  spellcheck?: boolean
  autoFocus?: boolean
  onBlur: React.FocusEventHandler<HTMLDivElement>
  onFocus: React.FocusEventHandler<HTMLDivElement>
}): JSX.Element | undefined => {
  return (
    <Textbit.Editable
      // key={path} // Necessary? This triggers a re-render if the path changes
      autoFocus={autoFocus}
      onBlur={onBlur}
      onFocus={onFocus}
      lang={documentLanguage}
      className={cn(!singleLine && 'min-h-20!',
        `p-1
        py-1.5
        ps-2
        rounded-md
        outline-none
        ring-offset-background
        focus:ring-1
        ring-input
        focus:dark:ring-gray-600
        whitespace-nowrap
        **:data-spelling-error:border-b-2
        **:data-spelling-error:border-dotted
        **:data-spelling-error:border-red-500
        dark:bg-input`
      )}
    >
      <ContextMenu className='z-9999' />
    </Textbit.Editable>
  )
}
