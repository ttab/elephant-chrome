import { useSession } from '@/hooks'
import {
  Avatar as AvatarMain,
  AvatarFallback,
  Popover,
  PopoverTrigger,
  PopoverContent
} from '@ttab/elephant-ui'

export const Avatar = (): JSX.Element => {
  const [jwt] = useSession()

  return (
    <Popover>

      <PopoverTrigger className='mr-2'>
        <AvatarMain>
          <AvatarFallback className='bg-green-300 dark:bg-blue-900 rounded-full'>{jwt?.sub.replace('user://tt/', '') || '?'}</AvatarFallback>
        </AvatarMain>
      </PopoverTrigger>

      <PopoverContent className="w-80" sideOffset={20} align='end' alignOffset={15}>
        <div className="space-y-2">
          <h4 className="font-medium leading-none">User</h4>
          <p className="text-sm text-muted-foreground">
            {jwt?.sub_name}
          </p>
            {jwt?.units.map((unit: string) => {
              return (
                <p className="text-sm text-muted-foreground">
                  {unit}
                </p>
              )
            })}
          <p className="text-sm text-muted-foreground">
            {jwt?.scope}
          </p>
        </div>
      </PopoverContent>

    </Popover>
  )
}
