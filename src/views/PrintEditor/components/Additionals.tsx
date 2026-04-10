import type { JSX } from 'react'
import { useMemo, useCallback } from 'react'
import { useYValue } from '@/modules/yjs/hooks/useYValue'
import type { YDocument } from '@/modules/yjs/hooks/useYDocument'
import { Label, Checkbox } from '@ttab/elephant-ui'
import type * as Y from 'yjs'
import { Block, type Document } from '@ttab/elephant-api/newsdoc'
import { LoaderIcon } from 'lucide-react'

export const Additionals = ({ ydoc, basePath, layout}: {
  ydoc: YDocument<Y.Map<unknown>>
  basePath: string
  layout?: Document
}): JSX.Element | null => {
  const [articleAdditionals, setArticleAdditionals] = useYValue<Block[]>(
    ydoc.ele,
    `${basePath}.meta.tt/print-features[0].content.tt/print-feature`
  )
  const [articleLayoutName] = useYValue(ydoc.ele, `${basePath}.name`)

  const items = useMemo((): Block[] => (
    layout?.content.find((item) => item.name === articleLayoutName)?.meta
      .find((m) => m.type === 'tt/print-features')?.content ?? []
  ), [layout, articleLayoutName])

  const checkedNames = useMemo(() => new Set(
    articleAdditionals?.filter((a: Block) => a.value === 'true').map((a) => a.name) ?? []
  ), [articleAdditionals])

  const handleChange = useCallback((name: string) => {
    const idx = articleAdditionals?.findIndex((item) => item.name === name)
    if (idx === undefined || idx === -1) {
      setArticleAdditionals([...(articleAdditionals ?? []), Block.create({ type: 'tt/print-feature', name, value: 'true' })])
    } else {
      const newAdditionals = [...(articleAdditionals || [])]
      newAdditionals[idx] = { ...newAdditionals[idx], value: newAdditionals[idx].value === 'true' ? 'false' : 'true' }
      setArticleAdditionals(newAdditionals)
    }
  }, [articleAdditionals, setArticleAdditionals])

  if (!layout) {
    return <LoaderIcon size={16} strokeWidth={1.75} className='animate-spin' />
  }

  if (!items.length) return null

  return (
    <div className='col-span-12 row-span-1 flex flex-col gap-2 mt-1'>
      <Label htmlFor='additionals'>Tillägg</Label>
      <div id='additionals' className='grid grid-cols-2 gap-2'>
        {items.map((item) => (
          <Label key={item.name} className='flex items-center gap-2'>
            <Checkbox
              className='bg-white'
              checked={checkedNames.has(item.name)}
              onCheckedChange={() => {
                handleChange(item.name)
              }}
            />
            {item.name}
          </Label>
        ))}
      </div>
    </div>
  )
}

