import type { Target } from '@/components/Link/lib/handleLink'
import { handleLink } from '@/components/Link/lib/handleLink'
import { useHistory, useNavigation, useView } from '@/hooks/index'
import type { View, ViewProps } from '@/types/index'
import { Button, Tooltip } from '@ttab/elephant-ui'
import type { LucideIcon } from '@ttab/elephant-ui/icons'

export const ToastAction = ({ actions }: {
  actions: {
    label: string
    view: View
    props?: ViewProps
    target?: Target
    icon: LucideIcon
  }[]
}): JSX.Element => {
  const { state, dispatch } = useNavigation()
  const history = useHistory()
  const { viewId } = useView()

  const handleAction = (view: View, props?: ViewProps, target?: Target) => {
    handleLink({
      dispatch,
      viewItem: state.viewRegistry.get(view),
      props,
      history,
      origin: viewId,
      viewId: crypto.randomUUID(),
      target: target || 'last'
    })
  }

  return (
    <div className='flex flex-row w-full gap-2 justify-end'>
      {actions.map((item) => {
        return (
          <Tooltip
            key={item.label}
            content={item.label}
          >
            <Button
              variant='icon'
              onClick={() => handleAction(item.view, item.props, item.target)}
            >
              <item.icon size={16} strokeWidth={1.75} />
            </Button>
          </Tooltip>
        )
      })}
    </div>
  )
}
