import {
  Toolbar as TextbitToolbar,
  usePluginRegistry
} from '@ttab/textbit'
import { ToolbarItem } from './ToolbarItem'

export const Toolbar = (): JSX.Element => {
  const { actions } = usePluginRegistry()
  const leafActions = actions.filter(action => ['leaf'].includes(action.plugin.class))
  const inlineActions = actions.filter(action => ['inline'].includes(action.plugin.class))

  return (
    <TextbitToolbar.Root
      className="flex
      min-w-12
      select-none
      divide-x
      p-1
      rounded-lg
      cursor-default
      shadow-xl
      border
      bg-white
      border-gray-100
      dark:text-white
      dark:bg-slate-900
      dark:border-slate-800
      dark:divide-slate-800
      dark:shadow-none"
    >
      <TextbitToolbar.Group key="leafs" className="flex place-items-center pr-1 gap-1">
        {leafActions.map(action => {
          return <ToolbarItem action={action} key={`${action.plugin.name}`} />
        })}
      </TextbitToolbar.Group>

      <TextbitToolbar.Group key="inlines" className="flex pl-1">
        {inlineActions.map(action => {
          return <ToolbarItem
            action={action}
            key={`${action.plugin.name}`}
          />
        })}
      </TextbitToolbar.Group>
    </TextbitToolbar.Root>
  )
}
