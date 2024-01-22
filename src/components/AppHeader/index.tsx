import { Menu } from './Menu'
import {
  Avatar,
  AvatarGroup
} from '../Avatar'
import { useSession } from '@/hooks'
import { getInitials } from '@/lib/getInitials'

export const AppHeader = (): JSX.Element => {
  const { jwt } = useSession()

  return (
    <header className='justify-end flex gap-3 border-b items-center h-14 bg-background pr-3'>
      <Menu />

      <AvatarGroup>
        <Avatar
          name={jwt?.sub_name || 'No name...'}
          initials={getInitials(jwt?.sub_name || '??')}
        >
          <p className="text-sm text-muted-foreground">{jwt?.sub_name}</p>
          {jwt?.units.map((unit: string, index: number) => {
            return (
              <p key={index} className="text-sm text-muted-foreground">
                {unit}
              </p>
            )
          })}
          <p className="text-sm text-muted-foreground">{jwt?.scope}</p>
        </Avatar>
      </AvatarGroup>
    </header >
  )
}
