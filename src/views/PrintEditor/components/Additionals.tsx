import type { JSX } from 'react'
import { useMemo } from 'react'
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

  const [articleLayoutName] = useYValue<string>(ydoc.ele, `${basePath}.name`)
  const checkedNames = useMemo(
    () => new Set(articleAdditionals
      ?.filter((addition) => addition.value === 'true')
      .map((addition) => addition.name) ?? []),
    [articleAdditionals]
  )

  if (!layout) {
    return <LoaderIcon size={16} strokeWidth={1.75} className='animate-spin' />
  }

  const items = layout?.content
    .find((item) => item.name === articleLayoutName)?.meta
    .find((m) => m.type === 'tt/print-features')?.content


  const handleChange = (name: string) => {
    if (!articleAdditionals || articleAdditionals.length === 0) {
      setArticleAdditionals([Block.create({ type: 'tt/print-feature', name, value: 'true' })])
    } else {
      const existingIndex = articleAdditionals.findIndex((item) => item.name === name)

      if (existingIndex !== -1) {
        const newAdditionals = [...articleAdditionals]
        newAdditionals[existingIndex] = {
          ...newAdditionals[existingIndex],
          value: newAdditionals[existingIndex].value === 'true' ? 'false' : 'true'
        }
        setArticleAdditionals(newAdditionals)
      } else {
        setArticleAdditionals([
          ...articleAdditionals,
          Block.create({ type: 'tt/print-feature', name, value: 'true' })
        ])
      }
    }
  }

  if (items?.length) {
    return (
      <div className='col-span-12 row-span-1 flex flex-col gap-2 mt-1'>
        <Label htmlFor='additionals'>Tillägg</Label>
        <div id='additionals' className='grid grid-cols-2 gap-2'>
          {items.map((item) => {
            const checked = checkedNames.has(item.name)

            return (
              <Additional
                key={item.name}
                item={item}
                checked={checked}
                onChange={handleChange}
              />
            )
          })}
        </div>
      </div>
    )
  }

  return null
}

const Additional = ({ item, checked, onChange }: {
  item: Block
  checked: boolean
  onChange: (name: string) => void
}) => (
  <Label key={item.name} className='flex items-center gap-2'>
    <Checkbox
      className='bg-white'
      checked={checked}
      onCheckedChange={() => {
        onChange(item.name)
      }}
    />
    {item.name}
  </Label>
)
