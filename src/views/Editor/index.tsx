import { useEffect, useRef } from 'react'
import { AwarenessDocument, View } from '@/components'
import { Notes } from './components/Notes'

import { Textbit, useTextbit } from '@ttab/textbit'
import { Bold, Italic, Link, Text, TTVisual, Factbox, Table, LocalizedQuotationMarks } from '@ttab/textbit-plugins'
import { ImageSearchPlugin } from '../../plugins/ImageSearch'
import { FactboxPlugin } from '../../plugins/Factboxes'
import { Editor as PlainEditor } from '@/components/PlainEditor'

import {
  useQuery,
  useCollaboration,
  useLink,
  useYValue,
  useView,
  useYjsEditor,
  useAwareness,
  useHistory,
  useWorkflowStatus
} from '@/hooks'
import type { ContentState, ViewMetadata, ViewProps } from '@/types'
import { EditorHeader } from './EditorHeader'
import { type HocuspocusProvider } from '@hocuspocus/provider'
import { type AwarenessUserData } from '@/contexts/CollaborationProvider'
import { Error } from '../Error'

import { ContentMenu } from '@/components/Editor/ContentMenu'
import { Toolbar } from '@/components/Editor/Toolbar'
import { ContextMenu } from '@/components/Editor/ContextMenu'
import { Gutter } from '@/components/Editor/Gutter'
import { DropMarker } from '@/components/Editor/DropMarker'

import type { Block } from '@ttab/elephant-api/newsdoc'
import { getValueByYPath } from '@/lib/yUtils'
import { useOnSpellcheck } from '@/hooks/useOnSpellcheck'
import { contentMenuLabels } from '@/defaults/contentMenuLabels'
import type { HistoryInterface } from '@/navigation/hooks/useHistory'
import useSWR from 'swr'

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
  const history = useHistory()
  const { viewId } = useView()
  const [workflowStatus] = useWorkflowStatus(props.id as string, true)

  const { data: isReadOnly } = useSWR([`editor_status/${props.id}`], () => {
    const isReadOnly = (history: HistoryInterface): bigint | string | undefined | boolean => {
      const viewState = history.state?.contentState?.find((state: ContentState) => state?.viewId === viewId)

      if (!viewState?.readOnly) {
        return false
      }

      if (viewState?.readOnly) {
        if (viewState?.readOnly.version === 0n) {
          return workflowStatus?.version
        }

        return viewState.readOnly.version as bigint
      }
    }

    return isReadOnly(history) || 0n
  })


  const documentId = props.id || query.id

  // Error handling for missing document
  if (!documentId || typeof documentId !== 'string') {
    return (
      <Error
        title='Artikeldokument saknas'
        message='Inget artikeldokument är angivet. Navigera tillbaka till översikten och försök igen.'
      />
    )
  }

  if (isReadOnly) {
    const bigIntVersion = isReadOnly === 'latest' ? 0n : BigInt(isReadOnly)

    return (
      <div className='overflow-x-hidden'>
        <EditorHeader documentId={documentId} readOnly readOnlyVersion={bigIntVersion} />
        <View.Content className='flex flex-col max-w-[1000px] px-4 h-full overflow-x-hidden'>
          <PlainEditor id={documentId} version={bigIntVersion} />
        </View.Content>
      </div>
    )
  }

  return (
    <AwarenessDocument documentId={documentId} className='h-full'>
      <EditorWrapper documentId={documentId} {...props} />
    </AwarenessDocument>
  )
}


// Main editor wrapper after document initialization
function EditorWrapper(props: ViewProps & {
  documentId: string
  autoFocus?: boolean
}): JSX.Element {
  const { provider, synced, user } = useCollaboration()
  const openFactboxEditor = useLink('Factbox')
  const [notes] = useYValue<Block[] | undefined>('meta.core/note')
  const [, setIsFocused] = useAwareness(props.documentId)

  // Plugin configuration
  const getConfiguredPlugins = () => {
    const basePlugins = [
      Bold,
      Italic,
      Link,
      TTVisual,
      ImageSearchPlugin,
      FactboxPlugin,
      Table,
      LocalizedQuotationMarks
    ]

    return [
      ...basePlugins.map((initPlugin) => initPlugin()),
      Text({
        countCharacters: ['heading-1'],
        ...contentMenuLabels
      }),
      Factbox({
        onEditOriginal: (id: string) => {
          openFactboxEditor(undefined, { id })
        }
      })
    ]
  }

  return (
    <View.Root>
      <Textbit.Root
        autoFocus={props.autoFocus ?? true}
        onBlur={() => {
          setIsFocused(false)
        }}
        onFocus={() => {
          setIsFocused(true)
        }}
        plugins={getConfiguredPlugins()}
        placeholders='multiple'
        className='h-screen max-h-screen flex flex-col'
      >
        <EditorContainer
          provider={provider}
          synced={synced}
          user={user}
          documentId={props.documentId}
          notes={notes}
        />
      </Textbit.Root>
    </View.Root>
  )
}


// Container component that uses TextBit context
function EditorContainer({
  provider,
  synced,
  user,
  documentId,
  notes
}: {
  provider: HocuspocusProvider | undefined
  synced: boolean
  user: AwarenessUserData
  documentId: string
  notes: Block[] | undefined
}): JSX.Element {
  const { words, characters } = useTextbit()

  return (
    <>
      <EditorHeader documentId={documentId} />
      {!!notes?.length && <div className='p-4'><Notes /></div>}
      <View.Content className='flex flex-col max-w-[1000px]'>

        <div className='flex-grow overflow-auto pr-12 max-w-screen-xl'>
          {!!provider && synced
            ? <EditorContent provider={provider} user={user} />
            : <></>}
        </div>
      </View.Content>

      <View.Footer>
        <div className='flex gap-2'>
          <strong>Words:</strong>
          <span>{words}</span>
        </div>
        <div className='flex gap-2'>
          <strong>Characters:</strong>
          <span>{characters}</span>
        </div>
      </View.Footer>
    </>
  )
}


function EditorContent({ provider, user }: {
  provider: HocuspocusProvider
  user: AwarenessUserData
}): JSX.Element {
  const { isActive } = useView()
  const ref = useRef<HTMLDivElement>(null)
  const [documentLanguage] = getValueByYPath<string>(provider.document.getMap('ele'), 'root.language')

  const yjsEditor = useYjsEditor(provider, user)
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
        [&_[data-spelling-error]]:border-b-2
        [&_[data-spelling-error]]:border-dotted
        [&_[data-spelling-error]]:border-red-500
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
