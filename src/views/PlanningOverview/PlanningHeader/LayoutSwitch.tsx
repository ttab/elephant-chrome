import { TabsList, TabsTrigger } from '@ttab/elephant-ui'
import { Grid2x2, List } from '@ttab/elephant-ui/icons'

export const TabsGrid = (): JSX.Element => (
  <TabsList className='grid grid-cols-2 h-9 p-1'>
    <TabsTrigger value='list'>
      <List size={18} strokeWidth={1.75} />
    </TabsTrigger>
    <TabsTrigger value='grid'>
      <Grid2x2 size={18} strokeWidth={1.75} />
    </TabsTrigger>
  </TabsList>
)
