import type { JSX } from 'react'
import { useMemo } from 'react'
import { View } from '@/components'
import { Notes } from '@/components/Notes'
import { Bold, Italic, Link, Text, TTVisual, Factbox, Table, LocalizedQuotationMarks } from '@ttab/textbit-plugins'
import { ImageSearchPlugin } from '../../plugins/ImageSearch'
import { FactboxPlugin } from '../../plugins/Factboxes'
import { Editor as PlainEditor } from '@/components/PlainEditor'
import { BaseEditor } from '@/components/Editor/BaseEditor'

import {
  useQuery,
  useLink,
  useWorkflowStatus
} from '@/hooks'
import type { ViewMetadata, ViewProps } from '@/types'
import { EditorHeader } from './EditorHeader'
import { Error } from '../Error'

import { getValueByYPath } from '@/shared/yUtils'
import { contentMenuLabels } from '@/defaults/contentMenuLabels'
import type { YDocument } from '@/modules/yjs/hooks'
import { useYDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'

// Metadata definition
const meta: ViewMetadata = {
  name: 'Editor',
  path: `${import.meta.env.BASE_URL || ''}/editor`,
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

// Main Editor Component - Handles document initialization
const Editor = (props: ViewProps): JSX.Element => {
  const [query] = useQuery()
  const documentId = props.id || query.id as string
  const preview = query.preview === 'true'

  const [workflowStatus] = useWorkflowStatus({ documentId, isWorkflow: true })

  // Error handling for missing document
  if (!documentId || typeof documentId !== 'string') {
    return (
      <Error
        title='Artikeldokument saknas'
        message='Inget artikeldokument är angivet. Navigera tillbaka till översikten och försök igen.'
      />
    )
  }

  // If published or specific version has be specified
  if (workflowStatus?.name === 'usable' || props.version || workflowStatus?.name === 'unpublished') {
    const bigIntVersion = workflowStatus?.name === 'usable'
      ? workflowStatus?.version
      : BigInt(props.version ?? 0)

    return (
      <View.Root>
        <EditorHeader
          ydoc={{ id: documentId } as YDocument<Y.Map<unknown>>}
          readOnly
          readOnlyVersion={bigIntVersion}
        />
        <View.Content className='flex flex-col max-w-[1000px] px-4 h-full' variant='grid'>
          <PlainEditor key={props.version} id={documentId} version={bigIntVersion} />
        </View.Content>
      </View.Root>
    )
  }

  return (
    <EditorWrapper
      {...props}
      preview={preview}
      documentId={documentId}
    />
  )
}

// Main editor wrapper after document initialization
function EditorWrapper(props: ViewProps & {
  documentId: string
  planningId?: string | null
  preview?: boolean
}): JSX.Element {
  const ydoc = useYDocument<Y.Map<unknown>>(props.documentId, {
    visibility: !props.preview
  })
  const [documentLanguage] = getValueByYPath<string>(ydoc.ele, 'root.language')
  const [content] = getValueByYPath<Y.XmlText>(ydoc.ele, 'content', true)
  const openFactboxEditor = useLink('Factbox')
  const openImageSearch = useLink('ImageSearch')
  const openFactboxes = useLink('Factboxes')

  // Plugin configuration
  const configuredPlugins = useMemo(() => {
    return [
      Bold(),
      Italic(),
      Link(),
      ImageSearchPlugin({ openImageSearch }),
      FactboxPlugin({ openFactboxes }),
      Table(),
      LocalizedQuotationMarks(),
      TTVisual({
        enableCrop: false
      }),
      Text({
        countCharacters: ['heading-1'],
        ...contentMenuLabels
      }),
      Factbox({
        onEditOriginal: (id: string) => {
          openFactboxEditor(undefined, { id })
        },
        removable: true
      })
    ]
  }, [openFactboxEditor, openFactboxes, openImageSearch])

  if (!content) {
    return <View.Root />
  }

  return (
    <View.Root>
      <EditorHeader ydoc={ydoc} planningId={props.planningId} readOnly={props.preview} />
      <div className='flex flex-col flex-1 min-h-0'>
        <BaseEditor.Root
          ydoc={ydoc}
          content={content}
          readOnly={props.preview}
          plugins={configuredPlugins}
          lang={documentLanguage}
        >
          <Notes ydoc={ydoc} />

          <View.Content className='flex flex-col max-w-[1000px]'variant='grid'>
            <div className='grow overflow-auto pr-12 max-w-(--breakpoint-xl)'>
              <BaseEditor.Text
                ydoc={ydoc}
                autoFocus={true}
              />
            </div>
          </View.Content>

          <View.Footer>
            <BaseEditor.Footer />
          </View.Footer>
        </BaseEditor.Root>
      </div>
    </View.Root>
  )
}

Editor.meta = meta

export { Editor }
