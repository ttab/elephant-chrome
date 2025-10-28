import { useDocuments } from '@/hooks/index/useDocuments'
import { ComboBox } from '@ttab/elephant-ui'
import { fields } from '@/shared/schemas/tvChannels'
import { useMemo, useState } from 'react'
import { useYjsEditor } from '@/hooks/useYjsEditor'
import { Transforms } from 'slate'
import type { TVChannels, TVChannelsFields } from '@/shared/schemas/tvChannels'
import { type TBElement } from '@ttab/textbit'
import type { YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'

export const ChannelComboBox = ({ ydoc }: {
  ydoc: YDocument<Y.Map<unknown>>
}) => {
  const { data } = useDocuments<TVChannels, TVChannelsFields>({
    documentType: 'tt/tv-channel',
    fields
  })

  const allTVChannels = useMemo(() => data?.map((hit) => ({
    label: hit.fields['document.title'].values[0],
    value: hit.fields['document.uri'].values[0]
  })) || [], [data])

  const editor = useYjsEditor(ydoc)

  const channel: string | undefined = useMemo(() => {
    const node: TBElement = editor?.children.find((c) => 'type' in c && c.type === 'tt/tv-listing') as TBElement
    if (node && ('properties' in node) && node?.properties) {
      return node.properties.channel as string || ''
    }
    return
  }, [editor?.children])

  const [selectedChannel, setSelectedChannel] = useState<string | undefined>(channel)
  const selectedOption = useMemo(() =>
    (allTVChannels || [])?.filter((c) => selectedChannel && c?.label === selectedChannel), [allTVChannels, selectedChannel])

  return (
    <ComboBox
      max={1}
      size='xs'
      sortOrder='label'
      options={allTVChannels}
      selectedOptions={selectedOption}
      placeholder={channel || 'Välj kanal'}
      onSelect={(option) => {
        setSelectedChannel(option.label)
        if (!editor) {
          return
        }

        const node: TBElement = editor.children.find((c) => 'type' in c && c.type === 'tt/tv-listing') as TBElement
        const nodeIndex = editor.children.findIndex((c) => 'type' in c && c?.type === 'tt/tv-listing')

        if (!node || nodeIndex === -1) {
          return
        }

        if (!Object.keys(node).some((k) => k === 'properties')) {
          return
        }

        const properties = node.properties

        Transforms.setNodes<TBElement>(
          editor,
          {
            properties: {
              ...properties,
              channel: option.label,
              uri: option.value
            }
          },
          { at: [nodeIndex] }
        )
      }}
    />
  )
}
