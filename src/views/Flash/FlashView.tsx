import { View } from '@/components'
import type { ViewProps } from '@/types'
import { useQuery } from '@/hooks'
import { Form } from '@/components/Form'
import { LocalizedQuotationMarks, Text } from '@ttab/textbit-plugins'
import { DocumentHeader } from '@/components/QuickDocument/DocumentHeader'
import { type JSX } from 'react'
import { getValueByYPath } from '@/shared/yUtils'
import { useYDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'
import { BaseEditor } from '@/components/Editor/BaseEditor'
import { contentMenuLabels } from '@/defaults/contentMenuLabels'
import { useDeliverablePlanningId } from '@/hooks/index/useDeliverablePlanningId'

export const FlashView = (props: ViewProps & {
  documentId: string
  version?: string
  readOnly?: boolean
  preview?: boolean
}): JSX.Element => {
  const [query] = useQuery()
  const readOnly = Number(props?.version) > 0 && !props.asDialog
  const preview = query.preview === 'true'

  const ydoc = useYDocument<Y.Map<unknown>>(props.documentId, {
    visibility: !preview
  })

  const planningId = useDeliverablePlanningId(ydoc.id || '')

  if (!props.id || !ydoc.provider?.isSynced) {
    return <></>
  }

  const [documentLanguage] = getValueByYPath<string>(ydoc.ele, 'root.language')
  const [content] = getValueByYPath<Y.XmlText>(ydoc.ele, 'content', true)
  const plugins = [LocalizedQuotationMarks]

  if (!content) {
    return <View.Root />
  }

  return (
    <View.Root className={props.className}>
      <BaseEditor.Root
        ydoc={ydoc}
        content={content}
        lang={documentLanguage}
        plugins={[
          ...plugins.map((initPlugin) => initPlugin()),
          Text({
            countCharacters: ['heading-1', 'body'],
            preventHotkeys: ['heading-1', 'heading-2', 'preamble'],
            ...contentMenuLabels
          })
        ]}
      >
        <DocumentHeader
          view='Flash'
          ydoc={ydoc}
          asDialog={false}
          readOnly={readOnly}
          preview={preview}
          planningId={planningId}
        />

        <View.Content className='flex flex-col max-w-[1000px]'>
          <Form.Root asDialog={props.asDialog}>
            <div className='grow overflow-auto max-w-(--breakpoint-xl)'>
              {!!ydoc.provider && ydoc.provider.isSynced
                && (
                  <BaseEditor.Text
                    ydoc={ydoc}
                    autoFocus={true}
                    allowStyling={false}
                    className='border-b'
                  />
                )}
            </div>
          </Form.Root>
        </View.Content>

        <View.Footer>
          <BaseEditor.Footer />
        </View.Footer>

      </BaseEditor.Root>
    </View.Root>
  )
}
