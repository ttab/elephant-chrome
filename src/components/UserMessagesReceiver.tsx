import { useEffect } from 'react'
import { useRegistry } from '@/hooks'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import type { Message } from '@ttab/elephant-api/user'
import type { User } from '@/shared/User'
import { AbortError } from '@/shared/types/errors'

export const UserMessagesReceiver = ({ children }: React.PropsWithChildren) => {
  const { user } = useRegistry()
  const { data } = useSession()


  /**
   * Start polling messages on first load
   */
  useEffect(() => {
    if (!data?.accessToken || !user) {
      return
    }

    let isActive = true
    const abortController = new AbortController()

    const startPolling = async () => {
      let lastId = -1

      while (isActive) {
        lastId = await execPolling(data.accessToken, user, lastId, abortController)
      }
    }

    const handleBeforeUnload = () => {
      abortController.abort()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    void startPolling().catch((ex) => {
      if (ex instanceof AbortError) {
        return
      }
      console.error('Unable to poll messages', ex)
    })

    return () => {
      isActive = false
      abortController.abort()
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [data?.accessToken, user])

  return (
    <>
      {children}
    </>
  )
}

async function execPolling(accessToken: string, user: User, lastId: number, abortController: AbortController): Promise<number> {
  try {
    const res = await user.pollMessages(lastId, accessToken, abortController.signal)

    res.messages.forEach((msg) => {
      displayMessageToast(msg)
    })

    return Number(res.lastId)
  } catch (ex) {
    if (ex instanceof AbortError) {
      throw ex
    }
    toast.error('Misslyckades att ansluta till meddelandetjänsten, vänligen ladda om fönstret.')
    throw ex
  }
}

const displayMessageToast = (message: Message) => {
  const msg = { ...message, id: Number(message.id) }

  const desc = [
    `Id: ${message.id}`,
    `Error: ${message.payload.err_message || message.payload.err_name || ''}`
  ]

  if (message.payload.rpc_code) {
    desc.push(`Rpc error: ${message.payload.rpc_code}`)
  }

  if (message.docType) {
    desc.push(`Document type: ${message.docType.replace('core://', '')}`)
  }

  if (message.docUuid) {
    desc.push(`Document UUID: ${message.docUuid}`)
  }

  toast.error(
    'Något gick fel',
    {
      description: desc.join(' '),
      duration: Infinity,
      closeButton: true,
      action: {
        label: 'Kopiera felmeddelande',
        onClick: () => void navigator.clipboard.writeText(JSON.stringify(msg, null, 2))
      }
    }
  )
}
