import { useQuery, useCollaboration, useYValue } from '@/hooks'
import { AwarenessDocument } from '@/components/AwarenessDocument'
import { type ViewProps, type ViewMetadata } from '@/types/index'
import { ViewHeader } from '@/components/View'
import { BookTextIcon } from '@ttab/elephant-ui/icons'
import type * as Y from 'yjs'
import { Bold, Italic, Text, OrderedList, UnorderedList } from '@ttab/textbit-plugins'
import Textbit, { DropMarker, Menu, type PluginRegistryAction, Toolbar, usePluginRegistry, useTextbit } from '@ttab/textbit'
import { type HocuspocusProvider } from '@hocuspocus/provider'
import { type AwarenessUserData } from '@/contexts/CollaborationProvider'
import { type PropsWithChildren, useEffect, useMemo, useState } from 'react'
import { withCursors, withYHistory, withYjs, YjsEditor } from '@slate-yjs/core'
import { createEditor } from 'slate'
import { type YXmlText } from 'node_modules/yjs/dist/src/internals'
import { TextBox } from '@/components/ui'
import { Button } from '@ttab/elephant-ui'
import { createStateless, StatelessType } from '@/shared/stateless'
import { useSession } from 'next-auth/react'
import { createDocument } from '@/lib/createYItem'
import { factboxDocumentTemplate } from '@/lib/templates/factboxDocumentTemplate'

const meta: ViewMetadata = {
  name: 'Factbox',
  path: `${import.meta.env.BASE_URL || ''}/factbox`,
  widths: {
    sm: 4,
    md: 4,
    lg: 4,
    xl: 4,
    '2xl': 4,
    hd: 4,
    fhd: 4,
    qhd: 3,
    uhd: 2
  }
}

export const Factbox = (props: ViewProps & { document?: Y.Doc }): JSX.Element => {
  const query = useQuery()
  const [document, setDocument] = useState<Y.Doc>()
  const documentId = props.id || query.id

  if (!documentId) {
    return <></>
  }

  if (props.onDocumentCreated && !document) {
    const [, doc] = createDocument((id) => factboxDocumentTemplate(id), true)
    setDocument(doc)
  }

  return (
    <>
      {documentId
        ? (
          <AwarenessDocument documentId={documentId} document={document} className='h-full'>
            <Wrapper {...props} documentId={documentId} />
          </AwarenessDocument>
          )
        : <></>
      }
    </>
  )
}

function Wrapper(props: ViewProps & { documentId: string }): JSX.Element {
  const plugins = [Text, UnorderedList, OrderedList, Bold, Italic]
  const {
    provider,
    synced,
    user
  } = useCollaboration()
  const { data: session, status } = useSession()
  const [isSaved, setSaved] = useState(false)
  const [inProgress] = useYValue('root.__inProgress')

  return (
    <Textbit.Root plugins={plugins.map(initPlugin => initPlugin())} placeholders="multiple" className="h-screen max-h-screen flex flex-col">
      <ViewHeader.Root>
        <ViewHeader.Title title='Faktaruta' icon={BookTextIcon} />

        <ViewHeader.Action>
          {!!props.documentId &&
            <ViewHeader.RemoteUsers documentId={props.documentId} />
          }
        </ViewHeader.Action>

      </ViewHeader.Root>

      <div className="flex-grow overflow-auto pr-12 max-w-screen-xl">
        {!!provider && synced
          ? <EditorContent provider={provider} user={user} />
          : <></>
        }
      </div>
      <div className='p-2'>
        {inProgress || isSaved
          ? (
            <Button
              disabled={isSaved}
              onClick={() => {
                if (provider && status === 'authenticated') {
                  provider.sendStateless(
                    createStateless(StatelessType.IN_PROGRESS, {
                      state: false,
                      id: props.documentId,
                      context: {
                        accessToken: session.accessToken
                      }
                    }))
                }
                setSaved(true)
              }}>Spara
            </Button>)
          : null}
      </div>
      <div className="h-14 basis-14">
        <Footer />
      </div>
    </Textbit.Root>
  )
}

function ToolbarItem({ action }: { action: PluginRegistryAction }): JSX.Element {
  return <Toolbar.Item
    action={action}
    className="p-2 w-8 h-8 flex place-items-center rounded border border-white hover:bg-gray-100 hover:border-gray-200 pointer data-[state='active']:bg-gray-100 data-[state='active']:border-gray-200 dark:border-gray-900 dark:hover:bg-slate-800 dark:hover:border-slate-700 dark:data-[state='active']:bg-gray-800 dark:data-[state='active']:border-slate-800 dark:hover:data-[state='active']:border-slate-700"
  />
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

function ToolbarMenu(): JSX.Element {
  const { actions } = usePluginRegistry()
  const leafActions = actions.filter(action => ['leaf'].includes(action.plugin.class))
  const inlineActions = actions.filter(action => ['inline'].includes(action.plugin.class))

  return (
    <Toolbar.Root
      className="flex
      min-w-12
      select-none
      divide-x
      p-1
      rounded-lg
      cursor-default
      shadow-xl
      border
      bg-white
      border-gray-100
      dark:text-white
      dark:bg-slate-900
      dark:border-slate-800
      dark:divide-slate-800
      dark:shadow-none"
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

function EditorContent({ provider, user }: {
  provider: HocuspocusProvider
  user: AwarenessUserData
}): JSX.Element {
  const yjsEditor = useMemo(() => {
    if (!provider?.awareness) {
      return
    }
    const content = provider.document.getMap('ele').get('content') as YXmlText

    if (!content) {
      return
    }
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
  }, [provider, user])

  useEffect(() => {
    if (yjsEditor) {
      YjsEditor.connect(yjsEditor)
      return () => YjsEditor.disconnect(yjsEditor)
    }
  }, [yjsEditor])

  return (
    <div className='w-full'>
      <TextBox
        path='root.title'
        placeholder='Rubrik'
        className='pl-4 font-bold text-lg basis-full w-full'
        autoFocus={true}
        singleLine={true}
      />
      <Textbit.Editable yjsEditor={yjsEditor} className="w-full outline-none h-full dark:text-slate-100">
        <DropMarker className="h-[3px] rounded bg-blue-400/75 dark:bg-blue-500/75 data-[state='between']:block" />
        <ToolbarMenu />
        <Textbit.Gutter className="w-14">
          <ContentMenu />
        </Textbit.Gutter>
      </Textbit.Editable>
    </div>
  )
}

function Footer(): JSX.Element {
  const { words, characters } = useTextbit()

  return (
    <footer className="flex line font-sans h-14 border-t text-sm p-3 pr-8 text-right gap-4 justify-end items-center">
      <div className="flex gap-2">
        <strong>Ord:</strong>
        <span>{words}</span>
      </div>
      <div className="flex gap-2">
        <strong>Tecken:</strong>
        <span>{characters}</span>
      </div>
    </footer>
  )
}

Factbox.meta = meta
