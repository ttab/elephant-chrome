import { TabsList, TabsTrigger } from '@ttab/elephant-ui'
import { List, Grid2x2 } from '@ttab/elephant-ui/icons'

export const TabsGrid = (): JSX.Element => {
  return (
    <TabsList className="grid grid-cols-2 h-8 p-0.5" id='test'>
      <TabsTrigger value="list">
        <List className="w-4 h-4" />
      </TabsTrigger>
      <TabsTrigger value="grid">
        <Grid2x2 className="w-4 h-4" />
      </TabsTrigger>
    </TabsList>
  )
}

