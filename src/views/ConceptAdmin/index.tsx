import { Commands } from '@/components/Commands'
import { TableCommandMenu } from '@/components/Commands/TableCommand'
import { View } from '@/components/View'
import { TableProvider } from '@/contexts/TableProvider'
import type { ViewMetadata } from '@/types/index'
import { useState } from 'react'


const meta: ViewMetadata = {
  name: 'ConceptAdmin',
  path: `${import.meta.env.BASE_URL}/conceptAdmin`,
  widths: {
    sm: 12,
    md: 12,
    lg: 6,
    xl: 6,
    '2xl': 6,
    hd: 6,
    fhd: 4,
    qhd: 3,
    uhd: 2
  }
}

export const ConceptAdmin = () => {
  const [currentTab, setCurrentTab] = useState<string>('list')
  return (
    <>
      <View.Root tab={currentTab} onTabChange={setCurrentTab}>
        <TableProvider<Concept>
          columns={columns}
          type={meta.name}>

          <TableCommandMenu heading='ConceptAdmin'>
            <Commands />
          </TableCommandMenu>

        </TableProvider>

      </View.Root>
    </>
  )
}

ConceptAdmin.meta = meta
