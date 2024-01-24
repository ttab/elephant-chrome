import { Menu } from './Menu'
import { Avatar } from '../Avatar'
import { useSession } from '@/hooks'
import { Popover, PopoverContent, PopoverTrigger } from '@ttab/elephant-ui'

export const AppHeader = (): JSX.Element => {
  const { jwt } = useSession()

  return (
    <header className='justify-end flex gap-3 border-b items-center h-14 bg-background pr-3'>
      <Menu />

      <Popover>
        <PopoverTrigger>
          <Avatar value={jwt?.sub_name || '??'} variant="color" />
        </PopoverTrigger>

        <PopoverContent className="w-80" align='end'>
          <div className="space-y-2">
            <h4 className="font-medium leading-none">{jwt?.sub_name || '??'}</h4>
            {jwt?.units.map((unit: string, index: number) => {
              return (
                <p key={index} className="text-sm text-muted-foreground">
                  {unit}
                </p>
              )
            })}
            <p className="text-sm text-muted-foreground">{jwt?.scope}</p>
          </div>
        </PopoverContent>
      </Popover>
    </header >
  )
}
