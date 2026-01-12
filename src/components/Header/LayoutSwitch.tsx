import { TabsList, TabsTrigger } from '@ttab/elephant-ui'
import { Grid2x2Icon, ListIcon } from '@ttab/elephant-ui/icons'
import type { JSX } from 'react'

export const TabsGrid = (): JSX.Element => (
  <TabsList className='gap-1'>
    <TabsTrigger value='list' className='px-0 w-8'>
      <ListIcon size={18} strokeWidth={1.75} />
    </TabsTrigger>
    <TabsTrigger value='grid' className='px-0 w-8'>
      <Grid2x2Icon size={18} strokeWidth={1.75} />
    </TabsTrigger>
  </TabsList>
)
