import { Button } from '@ttab/elephant-ui'
import { SunIcon, MoonIcon } from '@ttab/elephant-ui/icons'
import { useTheme } from '@/hooks'

export const ThemeSwitcher = (): JSX.Element => {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant='ghost'
      className='w-9 px-0'
      onClick={() => {
        setTheme(theme === 'dark'
          ? 'light'
          : 'dark')
      }}
    >
      <SunIcon size={18} strokeWidth={1.75} className='rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0' />
      <MoonIcon size={18} strokeWidth={1.75} className='absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100' />
      <span className='sr-only'>Toggle theme</span>
    </Button>
  )
}
