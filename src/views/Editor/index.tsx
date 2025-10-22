import { useEffect, useRef } from 'react'
import { View } from '@/components'
import { Notes } from '@/components/Notes'
import { Textbit, useTextbit } from '@ttab/textbit'
import { Bold, Italic, Link, Text, TTVisual, Factbox, Table, LocalizedQuotationMarks } from '@ttab/textbit-plugins'
import { ImageSearchPlugin } from '../../plugins/ImageSearch'
import { FactboxPlugin } from '../../plugins/Factboxes'
import { Editor as PlainEditor } from '@/components/PlainEditor'

import {
  useQuery,
  useLink,
  useView,
  useYjsEditor,
  useWorkflowStatus
} from '@/hooks'
import type { ViewMetadata, ViewProps } from '@/types'
import { EditorHeader } from './EditorHeader'
import { Error } from '../Error'

import { ContentMenu } from '@/components/Editor/ContentMenu'
import { Toolbar } from '@/components/Editor/Toolbar'
import { ContextMenu } from '@/components/Editor/ContextMenu'
import { Gutter } from '@/components/Editor/Gutter'
import { DropMarker } from '@/components/Editor/DropMarker'

import { getValueByYPath } from '@/shared/yUtils'
import { useOnSpellcheck } from '@/hooks/useOnSpellcheck'
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
  const [workflowStatus] = useWorkflowStatus(documentId, true)

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
        <View.Content className='flex flex-col max-w-[1000px] px-4 h-full'>
          <PlainEditor key={props.version} id={documentId} version={bigIntVersion} />
        </View.Content>
      </View.Root>
    )
  }

  return (
    <EditorWrapper
      {...props}
      documentId={documentId}
    />
  )
}

// Main editor wrapper after document initialization
function EditorWrapper(props: ViewProps & {
  documentId: string
  planningId?: string | null
  autoFocus?: boolean
}): JSX.Element {
  const ydoc = useYDocument<Y.Map<unknown>>(props.documentId)

  const openFactboxEditor = useLink('Factbox')

  // Plugin configuration
  const getConfiguredPlugins = () => {
    const basePlugins = [
      Bold,
      Italic,
      Link,
      ImageSearchPlugin,
      FactboxPlugin,
      Table,
      LocalizedQuotationMarks
    ]

    return [
      ...basePlugins.map((initPlugin) => initPlugin()),
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
  }

  return (
    <View.Root>
      <Textbit.Root
        autoFocus={props.autoFocus ?? true}
        plugins={getConfiguredPlugins()}
        placeholders='multiple'
        className='h-screen max-h-screen flex flex-col'
      >
        <EditorContainer
          ydoc={ydoc}
          planningId={props.planningId}
        />
      </Textbit.Root>
    </View.Root>
  )
}


// Container component that uses TextBit context
function EditorContainer({
  ydoc,
  planningId
}: {
  ydoc: YDocument<Y.Map<unknown>>
  planningId?: string | null
}): JSX.Element {
  const { stats } = useTextbit()

  return (
    <>
      <EditorHeader
        ydoc={ydoc}
        planningId={planningId}
      />
      <Notes ydoc={ydoc} />
      <View.Content className='flex flex-col max-w-[1000px]'>

        <div className='grow overflow-auto pr-12 max-w-(--breakpoint-xl)'>
          {ydoc.provider && ydoc.provider.isSynced
            ? <EditorContent ydoc={ydoc} />
            : <></>}
        </div>
      </View.Content>

      <View.Footer>
        <div className='flex gap-2'>
          <strong>Ord:</strong>
          <span title='Antal ord: artikel (totalt)'>{`${stats.short.words} (${stats.full.words})`}</span>
        </div>
        <div className='flex gap-2'>
          <strong>Tecken:</strong>
          <span title='Antal tecken: artikel (totalt)'>{`${stats.short.characters} (${stats.full.characters})`}</span>
        </div>
      </View.Footer>
    </>
  )
}


function EditorContent({ ydoc }: {
  ydoc: YDocument<Y.Map<unknown>>
}): JSX.Element {
  const { isActive } = useView()
  const ref = useRef<HTMLDivElement>(null)
  const [documentLanguage] = getValueByYPath<string>(ydoc.ele, 'root.language')

  const yjsEditor = useYjsEditor(ydoc)
  const onSpellcheck = useOnSpellcheck(documentLanguage)

  // Handle focus on active state
  useEffect(() => {
    if (isActive && ref?.current?.dataset['state'] !== 'focused') {
      setTimeout(() => {
        ref?.current?.focus()
      }, 0)
    }
  }, [isActive, ref])

  return (
    <Textbit.Editable
      ref={ref}
      yjsEditor={yjsEditor}
      lang={documentLanguage}
      onSpellcheck={onSpellcheck}
      className='outline-none
        h-full
        dark:text-slate-100
        **:data-spelling-error:border-b-2
        **:data-spelling-error:border-dotted
        **:data-spelling-error:border-red-500
      '
    >
      <DropMarker />
      <Gutter>
        <ContentMenu />
      </Gutter>
      <Toolbar />
      <ContextMenu />
    </Textbit.Editable>
  )
}

Editor.meta = meta

export { Editor }
