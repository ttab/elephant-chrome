import { useEffect } from 'react'
import { useRegistry } from '@/hooks'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import type { Message } from '@ttab/elephant-api/user'
import type { User } from '@/shared/User'

export const UserMessagesSender = ({ children }: React.PropsWithChildren) => {
  const { user } = useRegistry()
  const { data } = useSession()

  /**
   * Start polling messages on first load
   */
  useEffect(() => {
    if (!data?.accessToken || !user) {
      return
    }

    void pollMessages(data.accessToken, user)
      .catch((ex) => console.error(ex))
  }, [data?.accessToken, user])

  return (
    <>
      {children}
    </>
  )
}

async function pollMessages(accessToken: string, user: User) {
  let lastId = -1
  do {
    lastId = await execPolling(accessToken, user, lastId)
  } while (lastId !== -500)
}


async function execPolling(accessToken: string, user: User, lastId: number): Promise<number> {
  try {
    const res = await user.pollMessages(lastId, accessToken)

    res.messages.forEach((msg) => {
      displayMessageToast(msg)
    })

    return Number(res.lastId)
  } catch (ex) {
    console.error('Unable to poll messages', ex)
    toast.error('Misslyckades att ansluta till meddelandetjänsten, vänligen ladda om fönstret.')
    return -500
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
