import { useYObserver } from '@/hooks'
import { Label, Switch } from '@ttab/elephant-ui'
import type * as Y from 'yjs'

export const PlanStatus = ({ yMap }: { yMap?: Y.Map<unknown> }): JSX.Element => {
  const [status, setStatus] = useYObserver(yMap, 'data.start')
  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="public"
        checked={status === 'true'}
        onCheckedChange={(value) => {
          setStatus(value ? 'true' : 'false')
        }}
        />
      <Label htmlFor="public">{status === 'true' ? 'Public' : 'Internal'}</Label>
    </div>
  )
}
