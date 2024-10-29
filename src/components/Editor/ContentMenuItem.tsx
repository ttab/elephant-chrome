import {
  Menu,
  type PluginRegistryAction
} from '@ttab/textbit'

export const ContentMenuItem = ({ action }: { action: PluginRegistryAction }): JSX.Element => {
  return (
    <Menu.Item
      action={action.name}
      className="grid gap-x-5 py-[0.4rem] border group grid-cols-[1.5rem_minmax(max-content,_220px)_minmax(max-content,_90px)] rounded cursor-default border-white hover:border-gray-200 hover:bg-gray-100 dark:border-slate-900 dark:hover:border-slate-700 dark:hover:bg-slate-800"
    >
      <Menu.Icon className="flex justify-self-end self-center group-data-[state='active']:font-semibold" />
      <Menu.Label className="self-center text-sm group-data-[state='active']:font-semibold" />
      <Menu.Hotkey className="justify-self-end self-center pl-6 pr-3 text-sm opacity-70" />
    </Menu.Item>
  )
}
