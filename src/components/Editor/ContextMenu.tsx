import {
  ContextMenu as TextbitContextMenu,
  useContextMenuHints
} from '@ttab/textbit'
import { ContextMenuItem } from './ContextMenuItem'
import { ContextMenuGroup } from './ContextMenuGroup'

export const ContextMenu = (): JSX.Element => {
  const { spelling } = useContextMenuHints() as {
    spelling: {
      text: string
      suggestions: string[]
      apply: (t: string) => void
    }
  }

  return (
    <TextbitContextMenu.Root className='
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
    '>
      {!!spelling?.suggestions &&
        <ContextMenuGroup>
          <>
            {spelling.suggestions.length === 0 &&
              <ContextMenuItem apply={() => { }}>Inga förslag</ContextMenuItem>
            }
          </>
          <>
            {spelling.suggestions.map((suggestion) => (
              <ContextMenuItem key={suggestion} apply={() => { spelling.apply(suggestion) }}>
                {suggestion}
              </ContextMenuItem>
            ))}
          </>
        </ContextMenuGroup>
      }
    </TextbitContextMenu.Root>
  )
}
