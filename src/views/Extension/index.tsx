import { useEffect, useRef, useCallback, useState, type JSX } from 'react'
import { useSession } from 'next-auth/react'
import { View, ViewHeader } from '@/components/View'
import { useRegistry, useNavigation, useHistory, useView } from '@/hooks'
import { handleLink, type Target } from '@/components/Link/lib/handleLink'
import type { ViewMetadata, View as ViewName, ViewProps } from '@/types'
import { ExtensionToolbar, type ToolbarItem } from './ExtensionToolbar'
import { usePostMessageCollab } from './usePostMessageCollab'

const meta: ViewMetadata = {
  name: 'Extension',
  path: `${import.meta.env.BASE_URL || ''}/extension`,
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

const EXTENSION_URL = `${import.meta.env.BASE_URL || ''}/extensions/sample/index.html`
const EXTENSION_ORIGIN = new URL(EXTENSION_URL, window.location.origin).origin

const Extension = (): JSX.Element => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const readyRef = useRef(false)
  const [title, setTitle] = useState('Extension')
  const [toolbarItems, setToolbarItems] = useState<ToolbarItem[]>([])
  const [buttonsLocked, setButtonsLocked] = useState(false)
  const { data: session } = useSession()
  const { server } = useRegistry()
  const { state: navState, dispatch } = useNavigation()
  const history = useHistory()
  const { viewId: origin } = useView()

  const postToIframe = useCallback((data: unknown) => {
    const win = iframeRef.current?.contentWindow
    if (win) {
      win.postMessage(data, EXTENSION_ORIGIN)
    }
  }, [])

  const { handleCollabMessage } = usePostMessageCollab(postToIframe)

  const handleButtonClick = useCallback((name: string) => {
    setButtonsLocked(true)
    postToIframe({ type: 'button_click', payload: { name } })
  }, [postToIframe])

  // Handle messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent): void => {
      if (event.source !== iframeRef.current?.contentWindow) {
        return
      }

      if (event.origin !== EXTENSION_ORIGIN) {
        return
      }

      const msgType = (event.data as { type?: string })?.type

      switch (msgType) {
        case 'loaded': {
          const loadedPayload = (event.data as { payload?: { title?: string, buttons?: ToolbarItem[] } })?.payload
          if (loadedPayload?.title) {
            setTitle(loadedPayload.title)
          }
          if (loadedPayload?.buttons) {
            setToolbarItems(loadedPayload.buttons)
          }

          readyRef.current = true

          if (session?.accessToken) {
            postToIframe({ type: 'access_token', payload: { accessToken: session.accessToken } })
          }

          const services: Record<string, string> = {}
          for (const [name, url] of Object.entries(server)) {
            services[name] = String(url)
          }
          postToIframe({ type: 'services', payload: services })
          break
        }

        case 'set_title': {
          const newTitle = (event.data as { payload?: { title?: string } })?.payload?.title
          if (newTitle) {
            setTitle(newTitle)
          }
          break
        }

        case 'set_buttons': {
          const buttons = (event.data as { payload?: { buttons?: ToolbarItem[] } })?.payload?.buttons
          if (buttons) {
            setToolbarItems(buttons)
          }
          break
        }

        case 'button_click_ack': {
          const ackPayload = (event.data as { payload?: { buttons?: ToolbarItem[] } })?.payload
          if (ackPayload?.buttons) {
            setToolbarItems(ackPayload.buttons)
          }
          setButtonsLocked(false)
          break
        }

        case 'open': {
          const payload = (event.data as { payload?: { name?: ViewName, props?: ViewProps, target?: Target } })?.payload
          if (!payload?.name) {
            break
          }

          const viewItem = navState.viewRegistry.get(payload.name)
          handleLink({
            dispatch,
            viewItem,
            props: payload.props ?? {},
            viewId: crypto.randomUUID(),
            origin,
            target: payload.target,
            history
          })
          break
        }

        case 'open_collab':
        case 'collab_update':
        case 'close_collab': {
          const collabPayload = (event.data as { payload?: { uuid?: string, update?: number[] } })?.payload ?? {}
          handleCollabMessage(msgType, collabPayload)
          break
        }

        default:
          console.warn('Extension: unknown message type from iframe:', msgType)
          break
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [session?.accessToken, server, postToIframe, navState.viewRegistry, dispatch, origin, history, handleCollabMessage])

  // Forward token refresh to iframe
  useEffect(() => {
    if (!readyRef.current || !session?.accessToken) {
      return
    }

    postToIframe({ type: 'access_token', payload: { accessToken: session.accessToken } })
  }, [session?.accessToken, postToIframe])

  return (
    <View.Root>
      <ViewHeader.Root>
        <ViewHeader.Title name='Extension' title={title} />

        <ViewHeader.Content className='min-w-0'>
          <ExtensionToolbar
            items={toolbarItems}
            locked={buttonsLocked}
            onButtonClick={handleButtonClick}
          />
        </ViewHeader.Content>

        <ViewHeader.Action />
      </ViewHeader.Root>

      <View.Content variant='no-scroll'>
        <iframe
          ref={iframeRef}
          src={EXTENSION_URL}
          sandbox='allow-scripts allow-same-origin'
          className='w-full h-full border-0'
        />
      </View.Content>
    </View.Root>
  )
}

Extension.meta = meta

export { Extension }
