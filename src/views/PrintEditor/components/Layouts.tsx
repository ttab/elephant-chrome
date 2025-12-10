import { useState } from 'react'
import type * as Y from 'yjs'
import { useYValue, type YDocument } from '@/modules/yjs/hooks'
import type { EleBlock } from '@/shared/types'
import { LayoutBoxHeader } from './Header'
import { LayoutBox } from './LayoutBox'

export const Layouts = ({ ydoc }: {
  ydoc: YDocument<Y.Map<unknown>>
}) => {
  const [layouts, setLayouts] = useYValue<EleBlock[]>(ydoc.ele, 'meta.tt/print-article[0].meta.tt/article-layout')
  const [openedLayoutId, setOpenedLayoutId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Array<string>>([])

  if (!layouts) {
    return null // Spinner
  }

  const handleSelectAll = () => {
    const allLayoutIds = layouts.map((layout) => layout.id)
    setSelected(allLayoutIds)
  }

  const handleSelectedDelete = () => {
    const filteredLayouts = layouts.filter((layout) => !selected.includes(layout.id))
    setLayouts(filteredLayouts)
    setSelected([])
  }

  const handleDeleteLayout = (layoutId: string) => {
    const filteredLayouts = layouts.filter((layout) => layout.id !== layoutId)
    setLayouts(filteredLayouts)
  }

  return (
    <aside className='top-0 sticky flex flex-col gap-3 items-end z-50 w-[2.75rem] flex-none self-start @4xl/view:col-span-4 @4xl/view:w-full @4xl/view:items-stretch mr-2.5'>
      <LayoutBoxHeader
        ydoc={ydoc}
        selected={selected}
        onSelectAll={handleSelectAll}
        onSelectedDelete={handleSelectedDelete}
      />
      {Array.isArray(layouts) && layouts.length > 0 && (
        <div className='flex flex-col gap-1 items-end w-full pb-10 @4xl/view:gap-2'>
          {layouts.map((layout, index) => {
            const uuid = layout.links?.['_']?.[0]?.uuid
            if (!uuid) {
              return null
            }

            return (
              <LayoutBox
                key={layout.id}
                ydoc={ydoc}
                index={index}
                layoutIdForRender={layout.id}
                layoutUuid={uuid}
                openedLayoutId={openedLayoutId}
                setOpenedLayoutId={setOpenedLayoutId}
                onDeleteLayout={() => {
                  handleDeleteLayout(layout.id)
                  setSelected((prev) => prev.filter((id) => id !== layout.id))
                }}
                selected={selected}
                setSelected={setSelected}
              />
            )
          })}
        </div>
      )}
    </aside>
  )
}
