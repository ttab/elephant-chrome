import { useYObserver } from '@/hooks'
import { Button } from '@ttab/elephant-ui'
import { Building, Globe } from '@ttab/elephant-ui/icons'

export const PlanStatus = (): JSX.Element => {
  const { get, set, loading } = useYObserver('planning', 'meta.core/planning-item[0].data')

  const status = get('public')

  if (loading) {
    return <p>Loading</p>
  }

  return (
    <Button
      variant="ghost"
      className="flex w-10 p-0 px-3 data-[state=open]:bg-muted items-center"
    >
      <span className={'flex items-end'}>
        { status === 'true'
          ? <Globe size={18} strokeWidth={1.75} className='text-muted-foreground' onClick={() => set('false', 'public')} />
          : <Building size={18} strokeWidth={1.75} className='text-muted-foreground' onClick={() => set('true', 'public')} />
        }
      </span>
    </Button>
  )
}
