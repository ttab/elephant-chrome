import { useView } from '@/hooks/useView'
import { cn } from '@ttab/elephant-ui/utils'
import type { PropsWithChildren } from 'react'

export const Footer = ({ children, className }: {
  className?: string
} & PropsWithChildren): JSX.Element => {
  const { isFocused } = useView()
  return (
    <footer className={cn(
      'flex font-sans h-14 basis-14 border-t text-sm p-3 pr-8 text-right gap-4 justify-end items-center', {
        'mb-6': isFocused
      },
      className)}
    >
      {children}
    </footer>
  )
}

