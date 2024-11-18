import {
  ContextMenu as TextbitContextMenu,
  useContextMenuHints
} from '@ttab/textbit'
import { ContextMenuItem } from './ContextMenuItem'
import { ContextMenuGroup } from './ContextMenuGroup'
import { cn } from '@ttab/elephant-ui/utils'

export const ContextMenu = ({ className }: { className?: string }): JSX.Element => {
  const { spelling } = useContextMenuHints()

  return (
    <TextbitContextMenu.Root className={cn(`
      group
      flex
      flex-col
      border
      rounded-lg
      divide-y
      shadow-xl
      bg-white
      border-gray-100
      dark:text-white
      dark:bg-slate-900
      dark:border-slate-800
      dark:divide-slate-800
      dark:shadow-none
      `, className)}
    >
      {!!spelling?.suggestions
      && (
        <ContextMenuGroup>
          <>
            {spelling.suggestions.length === 0
            && <ContextMenuItem apply={() => { }}>Inga förslag</ContextMenuItem>}
          </>
          <>
            {spelling.suggestions.map((suggestion) => (
              <ContextMenuItem key={suggestion.text} apply={() => { spelling.apply(suggestion.text) }}>
                {suggestion.text}
                {!!suggestion.description
                && <span className='em text-muted-foreground text-xs max-w-60 pt-1'>{suggestion.description}</span>}
              </ContextMenuItem>
            ))}
          </>
        </ContextMenuGroup>
      )}
    </TextbitContextMenu.Root>
  )
}
