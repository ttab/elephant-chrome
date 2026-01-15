import { Form } from '@/components/Form'
import { TextInput } from '@/components/ui/TextInput'
import { useYValue } from '@/modules/yjs/hooks'
import type { YDocument } from '@/modules/yjs/hooks/useYDocument'
import type * as Y from 'yjs'

export const SectionContent = ({ ydoc, isActive, asDialog }: {
  ydoc: YDocument<Y.Map<unknown>>
  isActive: boolean | null
  asDialog: boolean | undefined
}) => {
  const [title] = useYValue<Y.XmlText>(ydoc.ele, 'root.title', true)
  const [code] = useYValue<Y.XmlText>(ydoc.ele, 'meta.core/section[0].data.code', true)
  return (
    <Form.Content>
      <TextInput
        ydoc={ydoc}
        value={title}
        className={isActive ? 'border' : 'bg-slate-100 text-slate-500'}
        placeholder='Titel'
        label='Titel'
        disabled={!isActive}
      />
      <TextInput
        ydoc={ydoc}
        value={code}
        asDialog={asDialog}
        className={isActive ? 'border' : 'bg-slate-100 text-slate-500'}
        placeholder='Kod'
        label='Kod'
        disabled={!isActive}
      />
    </Form.Content>
  )
}
