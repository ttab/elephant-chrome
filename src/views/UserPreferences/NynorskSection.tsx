import { useEffect, useState, type JSX } from 'react'
import { Button, Textarea } from '@ttab/elephant-ui'
import { useTranslation } from 'react-i18next'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { toast } from 'sonner'

export const NynorskSection = (): JSX.Element => {
  const { t } = useTranslation('app')
  const { preferences, updateNynorskPrefs } = useUserPreferences()
  const [value, setValue] = useState(preferences.nynorskPrefs ?? '')
  const [saving, setSaving] = useState(false)

  // Sync local state when remote settings arrive / change
  useEffect(() => {
    setValue(preferences.nynorskPrefs ?? '')
  }, [preferences.nynorskPrefs])

  const dirty = value !== (preferences.nynorskPrefs ?? '')

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateNynorskPrefs(value)
      toast.success(t('settings.saved'))
    } catch (err) {
      console.error('Failed to save nynorsk preferences', err)
      toast.error(t('settings.saveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className='flex flex-col gap-2 py-4 border-b'>
      <h3 className='font-semibold text-base text-foreground'>
        {t('settings.nynorskPrefs.title')}
      </h3>
      <p className='text-sm text-muted-foreground'>
        {t('settings.nynorskPrefs.description')}
      </p>
      <Textarea
        className='font-mono text-xs min-h-32'
        placeholder={t('settings.nynorskPrefs.placeholder')}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <div className='flex justify-end'>
        <Button onClick={handleSave} disabled={saving || !dirty}>
          {t('settings.save')}
        </Button>
      </div>
    </section>
  )
}
