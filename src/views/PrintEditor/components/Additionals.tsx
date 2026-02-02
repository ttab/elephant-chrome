import type { JSX } from 'react'
import { useMemo } from 'react'
import { useYValue } from '@/modules/yjs/hooks/useYValue'
import type { YDocument } from '@/modules/yjs/hooks/useYDocument'
import { Label, Checkbox } from '@ttab/elephant-ui'
import type * as Y from 'yjs'
import type { Document } from '@ttab/elephant-api/newsdoc'
import { LoaderIcon } from 'lucide-react'

export interface Additional {
  name: string
  value: string
}

export const Additionals = ({ ydoc, basePath, layout}: {
  ydoc: YDocument<Y.Map<unknown>>
  basePath: string
  layout?: Document
}): JSX.Element | null => {
  const [articleAdditionals, setArticleAdditionals] = useYValue<Additional[]>(
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
    .map((c) => ({ name: c.name, value: c.value }))


  const handleChange = (name: string) => {
    if (!articleAdditionals) return
    const updated = articleAdditionals
      .map((articleAdditional) =>
        articleAdditional.name === name
          ? { ...articleAdditional, value: articleAdditional.value === 'true'
              ? 'false'
              : 'true' }
          : articleAdditional
      )
    setArticleAdditionals(updated)
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
  item: Additional
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
