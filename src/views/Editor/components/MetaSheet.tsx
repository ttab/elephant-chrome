import { Story, Section, Byline } from '@/components'
import { SluglineButton } from '@/components/DataItem/Slugline'
import { useYValue } from '@/hooks/useYValue'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@ttab/elephant-ui'
import { RectangleEllipsis, X } from '@ttab/elephant-ui/icons'

export function MetaSheet({ container }: {
  container: HTMLElement | null
}): JSX.Element {
  const [contentSource] = useYValue<string | undefined>('links.core/content-source[0].uri')
  return (
    <Sheet>
      <SheetTrigger className='rounded-md hover:bg-gray-100 w-9 h-9 flex items-center justify-center'>
        <RectangleEllipsis size={18} strokeWidth={1.75} />
      </SheetTrigger>
      <SheetContent
        container={container}
        className='w-100vw h-100vh p-0 flex flex-col justify-between'
        defaultClose={false}
      >
        <div>
          <SheetHeader>
            <SheetTitle className='flex flex-row gap-4 justify-between justify-items-center items-center h-14 px-4'>
              Metadata
              <SheetClose className='rounded-md hover:bg-gray-100 w-9 h-9 flex items-center justify-center'>
                <X strokeWidth={2.25} />
              </SheetClose>
            </SheetTitle>
          </SheetHeader>
          <div className='flex flex-col gap-3 px-3 py-4 border-t'>
            <SheetDescription>
              Metadata för artikeln
            </SheetDescription>
            <div className='flex flex-row gap-2'>
              <Story />
              <Section />
            </div>
            <Byline />

            <div className='flex flex-shrink'>
              <SluglineButton path='meta.tt/slugline[0].value' />
            </div>
            <span className='font-thin text-muted-foreground text-xs'>{contentSource}</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
