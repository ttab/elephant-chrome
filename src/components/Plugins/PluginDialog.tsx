import { useState, useContext, type JSX, type FormEvent } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Button,
  Input
} from '@ttab/elephant-ui'
import { TrashIcon } from '@ttab/elephant-ui/icons'
import { toast } from 'sonner'
import { PluginContext, type PluginContextValue } from '@/lib/plugins'

export const PluginDialog = ({ open, onOpenChange }: {
  open: boolean
  onOpenChange: (open: boolean) => void
}): JSX.Element => {
  const pluginCtx = useContext(PluginContext) as PluginContextValue
  const [manifestUrl, setManifestUrl] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLoad(e: FormEvent): Promise<void> {
    e.preventDefault()

    if (!manifestUrl.trim()) {
      return
    }

    setLoading(true)
    try {
      await pluginCtx.loadPlugin(manifestUrl.trim())
      setManifestUrl('')
    } catch (err) {
      toast.error(`Plugin load failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle>Plugins</DialogTitle>
          <DialogDescription>Load and manage external plugins</DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleLoad(e)} className='flex gap-2'>
          <Input
            placeholder='Manifest URL'
            value={manifestUrl}
            onChange={(e) => setManifestUrl(e.target.value)}
            className='flex-1'
          />
          <Button type='submit' disabled={loading || !manifestUrl.trim()}>
            {loading ? 'Loading...' : 'Load'}
          </Button>
        </form>

        {pluginCtx.plugins.length > 0 && (
          <div className='mt-4 space-y-2'>
            {pluginCtx.plugins.map((plugin) => (
              <div key={plugin.id} className='flex items-center justify-between p-2 border rounded'>
                <div>
                  <div className='font-medium'>{plugin.name}</div>
                  <div className='text-xs text-muted-foreground'>
                    {plugin.version}
                    {plugin.description && ` — ${plugin.description}`}
                  </div>
                </div>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => pluginCtx.unloadPlugin(plugin.id)}
                >
                  <TrashIcon size={16} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
