import { Form } from '@/components/index'
import { TextInput } from '@/components/ui/TextInput'
import { useYValue } from '@/modules/yjs/hooks'
import type { YDocument } from '@/modules/yjs/hooks/useYDocument'
import type { ViewProps } from '@/types/index'
import type * as Y from 'yjs'

export const SectionContent = ({
  ydoc,
  isActive,
  ...props
}: ViewProps & { ydoc: YDocument<Y.Map<unknown>>, isActive: boolean | null }) => {
  const [title] = useYValue<Y.XmlText>(ydoc.ele, 'root.title', true)
  const [code] = useYValue<Y.XmlText>(ydoc.ele, 'meta.core/section[0].data.code', true)
  return (
    <Form.Content {...props} key={isActive ? 'active' : 'inactive'}>
      <TextInput
        ydoc={ydoc}
        value={title}
        className={isActive ? 'border' : 'bg-slate-100 text-slate-500'}
        placeholder='Titel'
        label='Titel'
        autoFocus={!!props.asDialog}
        disabled={!isActive}
      />
      <TextInput
        ydoc={ydoc}
        value={code}
        asDialog={props.asDialog}
        className={isActive ? 'border' : 'bg-slate-100 text-slate-500'}
        placeholder='Kod'
        label='Kod'
        disabled={!isActive}
      />
    </Form.Content>
  )
}
