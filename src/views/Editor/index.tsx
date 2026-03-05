import type { JSX } from 'react'
import { useCallback, useMemo, useState } from 'react'
import { View } from '@/components'
import { Notes } from '@/components/Notes'
import { Bold, Italic, Link, Text, TTVisual, Factbox, Table, LocalizedQuotationMarks } from '@ttab/textbit-plugins'
import { ImageSearchPlugin } from '../../plugins/ImageSearch'
import { FactboxPlugin } from '../../plugins/Factboxes'
import { Editor as PlainEditor } from '@/components/PlainEditor'
import { BaseEditor } from '@/components/Editor/BaseEditor'
import { toast } from 'sonner'

import {
  useQuery,
  useLink,
  useWorkflowStatus,
  useRegistry
} from '@/hooks'
import type { ViewMetadata, ViewProps } from '@/types'
import { EditorHeader } from './EditorHeader'
import { Error as ErrorComponent } from '../Error'

import { getValueByYPath } from '@/shared/yUtils'
import { contentMenuLabels } from '@/defaults/contentMenuLabels'
import type { YDocument } from '@/modules/yjs/hooks'
import { useYDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'
import { useSession } from 'next-auth/react'
import { CreatePrompt } from '@/components/CreatePrompt'
import { handleSaveFactbox } from '@/lib/handleSaveFactbox'

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
      <ErrorComponent
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
  const { repository } = useRegistry()
  const { data: session } = useSession()
  const [promptState, setCreatePrompt] = useState<{ id: string, onSuccess: () => void } | undefined>()

  const onSaveFactboxToArchive = useCallback((id: string, onSuccess: () => void) => {
    setCreatePrompt({ id, onSuccess })
  }, [])

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
        removable: true,
        factboxNewTitle: 'Fakta',
        saveToArchiveLabel: 'Spara till arkivet',
        unsavedLabel: 'Faktarutan har inte sparats till arkivet',
        onSave: onSaveFactboxToArchive
      })
    ]
  }, [openFactboxEditor, openFactboxes, openImageSearch, onSaveFactboxToArchive])

  if (!content) {
    return <View.Root />
  }

  return (
    <View.Root>
      <BaseEditor.Root
        ydoc={ydoc}
        content={content}
        readOnly={props.preview}
        plugins={configuredPlugins}
        lang={documentLanguage}
      >
        <EditorHeader ydoc={ydoc} planningId={props.planningId} readOnly={props.preview} />
        {promptState && (
          <CreatePrompt
            key='createFactbox'
            title='Spara faktaruta'
            description='Vill du spara faktarutan till arkivet?'
            secondaryLabel='Avbryt'
            primaryLabel='Spara'
            onPrimary={() => {
              if (!repository || !session?.accessToken || !documentLanguage || !content) {
                return
              }
              handleSaveFactbox({
                id: promptState.id,
                content,
                repository,
                accessToken: session?.accessToken,
                documentLanguage,
                onClose: () => setCreatePrompt(undefined)
              }).then(() => {
                promptState.onSuccess()
              }).catch((error) => {
                toast.error('Kunde inte spara faktarutan!')
                console.error(error)
              })
            }}
            onSecondary={() => {
              setCreatePrompt(undefined)
            }}
          />
        )}
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
    </View.Root>
  )
}

Editor.meta = meta

export { Editor }
