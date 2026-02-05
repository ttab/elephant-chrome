import { Form } from '@/components/Form'
import { TextInput } from '@/components/ui/TextInput'
import { useYValue, type YDocument } from '@/modules/yjs/hooks'
import type { ViewProps } from '@/types/index'
import type { Block } from '@ttab/elephant-api/newsdoc'
import { useMemo } from 'react'
import type * as Y from 'yjs'


export const StoryTagContent = ({ ydoc, isActive, ...props }:
 & ViewProps & { ydoc: YDocument<Y.Map<unknown>>, isActive: boolean | null }) => {
  const [title] = useYValue<Y.XmlText>(ydoc.ele, 'root.title', true)
  const [data] = useYValue<Block[]>(ydoc.ele, 'meta.core/definition', false)
  const textPaths = useMemo(() => {
    if (!data) return { shortIndex: -1, longIndex: -1 }
    const shortIndex = data?.findIndex((d) => d.role === 'short')
    const longIndex = data?.findIndex((d) => d.role === 'long')
    return { shortIndex, longIndex }
  }, [data])
  const [longText] = useYValue<Y.XmlText>(ydoc.ele, `meta.core/definition[${textPaths.longIndex}].data.text`, true)
  const [shortText] = useYValue<Y.XmlText>(ydoc.ele, `meta.core/definition[${textPaths.shortIndex}].data.text`, true)

  return (
    <Form.Content {...props} key={isActive ? 'active' : 'inactive'}>
      <TextInput
        ydoc={ydoc}
        label='Story tag'
        className={isActive ? 'border' : 'bg-slate-100 text-slate-500'}
        value={title}
        placeholder='Titel'
        autoFocus={!!props.asDialog}
        disabled={!isActive}
      />
      <TextInput
        ydoc={ydoc}
        label='Kod'
        asDialog={props.asDialog}
        value={shortText}
        className={isActive ? 'border' : 'bg-slate-100 text-slate-500'}
        placeholder='Kort text'
        disabled={!isActive}
      />
      <TextInput
        ydoc={ydoc}
        label='Lång text'
        value={longText}
        asDialog={props.asDialog}
        className={isActive ? 'border' : 'bg-slate-100 text-slate-500'}
        placeholder='Lång text'
        disabled={!isActive}
      />
    </Form.Content>
  )
}
