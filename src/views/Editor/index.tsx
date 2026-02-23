import type { JSX } from 'react'
import { useMemo, useState, useEffect } from 'react'
import { cn } from '@ttab/elephant-ui/utils'
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
import { EditorSkeleton } from './EditorSkeleton'
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

  const [workflowStatus] = useWorkflowStatus({ documentId })

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
      <PlainEditorWrapper
        {...props}
        documentId={documentId}
        bigIntVersion={bigIntVersion}
      />
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

  const isReady = !!(content && ydoc.synced)
  const [showSkeleton, setShowSkeleton] = useState(!isReady)

  useEffect(() => {
    if (isReady) {
      const timer = setTimeout(() => setShowSkeleton(false), 250)
      return () => clearTimeout(timer)
    }
  }, [isReady])

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

  return (
    <>
      {isReady && (
        <View.Root>
          <BaseEditor.Root
            ydoc={ydoc}
            content={content}
            readOnly={props.preview}
            plugins={configuredPlugins}
            lang={documentLanguage}
          >
            <EditorHeader ydoc={ydoc} planningId={props.planningId} readOnly={props.preview} />

            <Notes ydoc={ydoc} />

            <View.Content className='flex flex-col max-w-[1000px]' variant='grid'>
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
        </View.Root>
      )}

      {showSkeleton && (
        <div
          className={cn(
            'bg-background pointer-events-none transition-opacity duration-200',
            isReady ? 'absolute inset-0 opacity-0' : 'opacity-100'
          )}
        >
          <EditorSkeleton />
        </div>
      )}
    </>
  )
}

function PlainEditorWrapper(props: ViewProps & {
  documentId: string
  bigIntVersion: bigint
}): JSX.Element {
  const [isLoaded, setIsLoaded] = useState(false)
  const [showSkeleton, setShowSkeleton] = useState(true)

  useEffect(() => {
    if (isLoaded) {
      const timer = setTimeout(() => setShowSkeleton(false), 250)
      return () => clearTimeout(timer)
    }
  }, [isLoaded])

  return (
    <>
      <View.Root>
        <EditorHeader
          ydoc={{ id: props.documentId } as YDocument<Y.Map<unknown>>}
          readOnly
          readOnlyVersion={props.bigIntVersion}
        />
        <View.Content className='flex flex-col max-w-[1000px] px-4 h-full' variant='grid'>
          <PlainEditor
            key={props.version}
            id={props.documentId}
            version={props.bigIntVersion}
            onLoad={() => setIsLoaded(true)}
          />
        </View.Content>
      </View.Root>

      {showSkeleton && (
        <div
          className={cn(
            'bg-background pointer-events-none transition-opacity duration-200',
            isLoaded ? 'absolute inset-0 opacity-0' : 'opacity-100'
          )}
        >
          <EditorSkeleton />
        </div>
      )}
    </>
  )
}

Editor.meta = meta

export { Editor }
