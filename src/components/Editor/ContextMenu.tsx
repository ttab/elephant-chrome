import {
  ContextMenu as TextbitContextMenu,
  useContextMenuHints
} from '@ttab/textbit'

export const ContextMenu = (): JSX.Element => {
  const { spelling } = useContextMenuHints()

  return (
    <TextbitContextMenu.Root className='textbit-contextmenu'>
      {!!spelling?.suggestions &&
        <TextbitContextMenu.Group className='textbit-contextmenu-group' key='spelling-suggestions'>
          <>
            {spelling.suggestions.length === 0 &&
              <TextbitContextMenu.Item
                className='textbit-contextmenu-item'
                func={() => { }}
              >
                No spelling suggestions
              </TextbitContextMenu.Item>
            }
          </>
          <>
            {spelling.suggestions.map(suggestion => {
              return (
                <TextbitContextMenu.Item
                  className='textbit-contextmenu-item'
                  key={suggestion}
                  func={() => { alert('replacing ' + suggestion) }}
                >
                  {suggestion}
                </TextbitContextMenu.Item>
              )
            })}
          </>
        </TextbitContextMenu.Group>
      }
    </TextbitContextMenu.Root>
  )
}
