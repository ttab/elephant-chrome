import type { JSX } from 'react'
import { Menu, usePluginRegistry } from '@ttab/textbit'
import { ContentMenuGroup } from './ContentMenuGroup'
import { ContentMenuItem } from './ContentMenuItem'

const factBoxActions = ['core/text/set-body',
  'core/ordered-list/add-ordered-list',
  'core/unordered-list/add-unordered-list'
]

export const ContentMenu = ({ editorType}: { editorType?: string }): JSX.Element => {
  const { actions } = usePluginRegistry()

  const textActions = actions.filter((action) => action.plugin.class === 'text')
  const blockActions = actions.filter((action) => action.plugin.class === 'block')
  const factBoxTextActions = actions.filter((action) => factBoxActions.includes(action.name))

  const visibleTextActions = editorType === 'factbox' ? factBoxTextActions : textActions

  return (blockActions.length > 0 || visibleTextActions.length > 0)
    ? (
        <Menu.Root className='group mt-2'>
          <Menu.Trigger className="flex justify-center place-items-center center font-bold border w-8 h-8 ml-3 rounded-full cursor-default group-data-[state='open']:border-gray-200 hover:border-gray-400 dark:text-slate-200 dark:bg-slate-950 dark:border-slate-600 dark:group-data-[state='open']:border-slate-700 dark:hover:border-slate-500">⋮</Menu.Trigger>
          <Menu.Content className='flex flex-col mt-[1.3rem] -ml-[1.3rem] border rounded-lg divide-y shadow-xl bg-white border-gray-100 dark:text-white dark:bg-slate-900 dark:border-slate-800 dark:divide-slate-800 dark:shadow-none z-50'>
            {blockActions.length > 0
              && (
                <ContentMenuGroup>
                  {blockActions.map((action) => <ContentMenuItem action={action} key={action.name} />)}
                </ContentMenuGroup>
              )}
            {visibleTextActions.length > 0
              && (
                <ContentMenuGroup>
                  {visibleTextActions.map((action) => <ContentMenuItem action={action} key={action.name} />)}
                </ContentMenuGroup>
              )}
          </Menu.Content>
        </Menu.Root>
      )
    : <></>
}
