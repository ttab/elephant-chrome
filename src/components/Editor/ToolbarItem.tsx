import {
  type PluginRegistryAction,
  Toolbar
} from '@ttab/textbit'

export function ToolbarItem({ action }: { action: PluginRegistryAction }): JSX.Element {
  return <Toolbar.Item
    action={action}
    className="p-2 w-8 h-8 flex place-items-center rounded border border-white hover:bg-gray-100 hover:border-gray-200 pointer data-[state='active']:bg-gray-100 data-[state='active']:border-gray-200 dark:border-gray-900 dark:hover:bg-slate-800 dark:hover:border-slate-700 dark:data-[state='active']:bg-gray-800 dark:data-[state='active']:border-slate-800 dark:hover:data-[state='active']:border-slate-700"
  />
}
