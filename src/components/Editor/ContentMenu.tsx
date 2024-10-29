import { Menu, usePluginRegistry } from '@ttab/textbit'
import { ContentMenuGroup } from './ContentMenuGroup'
import { ContentMenuItem } from './ContentMenuItem'

export const ContentMenu = (): JSX.Element => {
  const { actions } = usePluginRegistry()

  const textActions = actions.filter(action => action.plugin.class === 'text')
  const textblockActions = actions.filter(action => action.plugin.class === 'textblock')
  const blockActions = actions.filter(action => action.plugin.class === 'block')

  return (
    <Menu.Root className="group">
      <Menu.Trigger className="flex justify-center place-items-center center font-bold border w-8 h-8 ml-3 rounded-full cursor-default group-data-[state='open']:border-gray-200 hover:border-gray-400 dark:text-slate-200 dark:bg-slate-950 dark:border-slate-600 dark:group-data-[state='open']:border-slate-700 dark:hover:border-slate-500">⋮</Menu.Trigger>
      <Menu.Content className="flex flex-col mt-[1.3rem] -ml-[1.3rem] border rounded-lg divide-y shadow-xl bg-white border-gray-100 dark:text-white dark:bg-slate-900 dark:border-slate-800 dark:divide-slate-800 dark:shadow-none">
        {textActions.length > 0 &&
          <ContentMenuGroup>
            {textActions.map(action => <ContentMenuItem action={action} key={action.name} />)}
          </ContentMenuGroup>
        }

        {textblockActions.length > 0 &&
          <ContentMenuGroup>
            {textblockActions.map(action => <ContentMenuItem action={action} key={action.name} />)}
          </ContentMenuGroup>
        }
        {blockActions.length > 0 &&
          <ContentMenuGroup>
            {blockActions.map(action => <ContentMenuItem action={action} key={action.name} />)}
          </ContentMenuGroup>
        }
      </Menu.Content>
    </Menu.Root>
  )
}
