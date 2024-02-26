import { useYObserver } from '@/hooks'
import { Label, Switch } from '@ttab/elephant-ui'

export const PlanStatus = (): JSX.Element => {
  const { get, set } = useYObserver('meta.core/planning-item[0].data')

  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="public"
        checked={get('start') === 'true'}
        onCheckedChange={(value) => {
          set(value ? 'true' : 'false')
        }}
        />
      <Label htmlFor="public">{get('start') === 'true' ? 'Public' : 'Internal'}</Label>
    </div>
  )
}
