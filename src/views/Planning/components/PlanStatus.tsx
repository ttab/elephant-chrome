import { useEffect } from 'react'
import { useYMap } from '@/hooks'
import { type CollabComponentProps } from '@/types'
import { Label, Switch } from '@ttab/elephant-ui'
import { type YMap } from 'node_modules/yjs/dist/src/internals'

export const PlanStatus = ({ isSynced, document }: CollabComponentProps): JSX.Element => {
  const [status, setStatus, initStatus] = useYMap('core/planning-item/status')


  useEffect(() => {
    if (!isSynced || !document) {
      return
    }

    const planningYMap: YMap<unknown> = document.getMap('planning')
    initStatus(planningYMap)
  }, [
    isSynced,
    document,
    initStatus
  ])

  return isSynced && document
    ? (
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
    : <p>Loading</p>
}
