import { useMemo, type PropsWithChildren, useEffect, useState } from 'react'
import { AwarenessDocument, ViewHeader } from '@/components'
import { Notes } from './components/Notes'
import { PenBoxIcon } from '@ttab/elephant-ui/icons'

import { createEditor } from 'slate'
import { YjsEditor, withCursors, withYHistory, withYjs } from '@slate-yjs/core'
import type * as Y from 'yjs'

import {
  Textbit,
  Menu,
  Toolbar,
  DropMarker,
  useTextbit,
  usePluginRegistry,
  type PluginRegistryAction
} from '@ttab/textbit'

import { ImageSearchPlugin } from '../../plugins/ImageSearch'
import { FactboxPlugin } from '../../plugins/Factboxes'

import { Bold, Italic, Link, Text, OrderedList, UnorderedList, TTVisual, Factbox } from '@ttab/textbit-plugins'

import {
  useQuery,
  useCollaboration
} from '@/hooks'
import { type ViewMetadata, type ViewProps } from '@/types'
import { EditorHeader } from './EditorHeader'
import { type HocuspocusProvider } from '@hocuspocus/provider'
import { type AwarenessUserData } from '@/contexts/CollaborationProvider'
import { type YXmlText } from 'node_modules/yjs/dist/src/internals'
import { articleDocumentTemplate } from '@/lib/templates/articleDocumentTemplate'
import { createDocument } from '@/lib/createYItem'

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

const Editor = (props: ViewProps): JSX.Element => {
  const query = useQuery()
  const [document, setDocument] = useState<Y.Doc | undefined>(undefined)

  const documentId = props.id || query.id

  if (!documentId) {
    // TODO: Should we have a skeleton loading screen here
    // Or maybe a message that says "No document selected"?
    // This option shouldn't be possible in the UI, but it's possible to navigate to /editor without a document id
    return <></>
  }

  if (props.onDocumentCreated && !document) {
    const [, doc] = createDocument((id: string) => articleDocumentTemplate(id))
    setDocument(doc)

    return <></>
  }

  if (document && props.onDocumentCreated) {
    props.onDocumentCreated()
  }

  return (
    <AwarenessDocument documentId={documentId} document={document} className="h-full">
      <EditorWrapper documentId={documentId} {...props} />
    </AwarenessDocument>
  )
}

function EditorWrapper(props: ViewProps & {
  documentId: string
}): JSX.Element {
  const plugins = [Text, UnorderedList, OrderedList, Bold, Italic, Link, TTVisual, ImageSearchPlugin, Factbox, FactboxPlugin]
  const {
    provider,
    synced,
    user
  } = useCollaboration()

  return (
    <Textbit.Root plugins={plugins.map(initPlugin => initPlugin())} placeholders="multiple" className="h-screen max-h-screen flex flex-col">
      <ViewHeader.Root>
        <ViewHeader.Title title='Editor' icon={PenBoxIcon} />
        <ViewHeader.Content>
          <EditorHeader />
        </ViewHeader.Content>

        <ViewHeader.Action>
          {!!props.documentId &&
            <ViewHeader.RemoteUsers documentId={props.documentId} />
          }
        </ViewHeader.Action>

      </ViewHeader.Root>

      <div className='p-4'>
        <Notes />
      </div>
      <div className="flex-grow overflow-auto pr-12 max-w-screen-xl">
        {!!provider && synced
          ? <EditorContent provider={provider} user={user} />
          : <></>
        }
      </div>

      <div className="h-14 basis-14">
        <Footer />
      </div>
    </Textbit.Root>
  )
}

function EditorContent({ provider, user }: {
  provider: HocuspocusProvider
  user: AwarenessUserData
}): JSX.Element {
  const yjsEditor = useMemo(() => {
    if (!provider?.awareness) {
      return
    }

    const content = provider.document.getMap('ele').get('content') as YXmlText

    return withYHistory(
      withCursors(
        withYjs(
          createEditor(),
          content
        ),
        provider.awareness,
        { data: user as unknown as Record<string, unknown> }
      )
    )
  }, [provider?.awareness, provider?.document, user])


  // Connect/disconnect from provider through editor only when editor changes
  useEffect(() => {
    if (yjsEditor) {
      YjsEditor.connect(yjsEditor)
      return () => YjsEditor.disconnect(yjsEditor)
    }
  }, [yjsEditor])

  return (
    <Textbit.Editable yjsEditor={yjsEditor} className="outline-none h-full dark:text-slate-100">
      <DropMarker className="h-[3px] rounded bg-blue-400/75 dark:bg-blue-500/75 data-[state='between']:block" />
      <ToolbarMenu />
      <Textbit.Gutter className="w-14">
        <ContentMenu />
      </Textbit.Gutter>
    </Textbit.Editable>
  )
}

function ToolbarMenu(): JSX.Element {
  const { actions } = usePluginRegistry()
  const leafActions = actions.filter(action => ['leaf'].includes(action.plugin.class))
  const inlineActions = actions.filter(action => ['inline'].includes(action.plugin.class))

  return (
    <Toolbar.Root
      className="flex min-w-12 select-none divide-x p-1 rounded-lg cursor-default shadow-xl border bg-white border-gray-100 dark:text-white dark:bg-slate-900 dark:border-slate-800 dark:divide-slate-800 dark:shadow-none"
    >
      <Toolbar.Group key="leafs" className="flex place-items-center pr-1 gap-1">
        {leafActions.map(action => {
          return <ToolbarItem action={action} key={`${action.plugin.name}`} />
        })}
      </Toolbar.Group>

      <Toolbar.Group key="inlines" className="flex pl-1">
        {inlineActions.map(action => {
          return <ToolbarItem
            action={action}
            key={`${action.plugin.name}`}
          />
        })}
      </Toolbar.Group>
    </Toolbar.Root>
  )
}

function ToolbarItem({ action }: { action: PluginRegistryAction }): JSX.Element {
  return <Toolbar.Item
    action={action}
    className="p-2 w-8 h-8 flex place-items-center rounded border border-white hover:bg-gray-100 hover:border-gray-200 pointer data-[state='active']:bg-gray-100 data-[state='active']:border-gray-200 dark:border-gray-900 dark:hover:bg-slate-800 dark:hover:border-slate-700 dark:data-[state='active']:bg-gray-800 dark:data-[state='active']:border-slate-800 dark:hover:data-[state='active']:border-slate-700"
  />
}

function ContentMenu(): JSX.Element {
  const { actions } = usePluginRegistry()

  const textActions = actions.filter(action => action.plugin.class === 'text')
  const textblockActions = actions.filter(action => action.plugin.class === 'textblock')
  const blockActions = actions.filter(action => action.plugin.class === 'block')

  return (
    <Menu.Root className="group">
      <Menu.Trigger className="flex justify-center place-items-center center font-bold border w-8 h-8 ml-3 rounded-full cursor-default group-data-[state='open']:border-gray-200 hover:border-gray-400 dark:text-slate-200 dark:bg-slate-950 dark:border-slate-600 dark:group-data-[state='open']:border-slate-700 dark:hover:border-slate-500">⋮</Menu.Trigger>
      <Menu.Content className="flex flex-col -mt-[0.75rem] ml-[2.25rem] border rounded-lg divide-y shadow-xl bg-white border-gray-100 dark:text-white dark:bg-slate-900 dark:border-slate-800 dark:divide-slate-800 dark:shadow-none">
        {textActions.length > 0 &&
          <ContentMenuGroup>
            {textActions.map(action => <ContentMenuItem action={action} key={action.name} />)}
          </ContentMenuGroup>
        }

        {textblockActions.length > 0 &&
          <ContentMenuGroup>
            {textblockActions.map(action => <ContentMenuItem action={action} key={action.name} />)}
          </ContentMenuGroup>
        }
        {blockActions.length > 0 &&
          <ContentMenuGroup>
            {blockActions.map(action => <ContentMenuItem action={action} key={action.name} />)}
          </ContentMenuGroup>
        }
      </Menu.Content>
    </Menu.Root>
  )
}

function ContentMenuGroup({ children }: PropsWithChildren): JSX.Element {
  return (
    <Menu.Group className="flex flex-col p-1 text-md">
      {children}
    </Menu.Group>
  )
}

function ContentMenuItem({ action }: { action: PluginRegistryAction }): JSX.Element {
  return (
    <Menu.Item
      action={action.name}
      className="grid gap-x-5 py-[0.4rem] border group grid-cols-[1.5rem_minmax(max-content,_220px)_minmax(max-content,_90px)] rounded cursor-default border-white hover:border-gray-200 hover:bg-gray-100 dark:border-slate-900 dark:hover:border-slate-700 dark:hover:bg-slate-800"
    >
      <Menu.Icon className="flex justify-self-end self-center group-data-[state='active']:font-semibold" />
      <Menu.Label className="self-center text-sm group-data-[state='active']:font-semibold" />
      <Menu.Hotkey className="justify-self-end self-center pl-6 pr-3 text-sm opacity-70" />
    </Menu.Item>
  )
}

function Footer(): JSX.Element {
  const { words, characters } = useTextbit()

  return (
    <footer className="flex line font-sans h-14 border-t text-sm p-3 pr-8 text-right gap-4 justify-end items-center">
      <div className="flex gap-2">
        <strong>Words:</strong>
        <span>{words}</span>
      </div>
      <div className="flex gap-2">
        <strong>Characters:</strong>
        <span>{characters}</span>
      </div>
    </footer>
  )
}

Editor.meta = meta

export { Editor }
