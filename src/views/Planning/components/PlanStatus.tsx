import { useYObserver } from '@/hooks'
import { } from '@ttab/elephant-ui'
import { Building, Globe } from '@ttab/elephant-ui/icons'

export const PlanStatus = (): JSX.Element => {
  const { get, set } = useYObserver('planning', 'meta.core/planning-item[0].data')

  const status = get('public')

  return status === 'true'
    ? <Globe className='size-4 text-muted-foreground' onClick={() => set('false', 'public')}/>
    : <Building className='size-4 text-muted-foreground' onClick={() => set('true', 'public')}/>
}
