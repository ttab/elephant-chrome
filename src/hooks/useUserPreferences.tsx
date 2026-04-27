import { useCallback, useMemo } from 'react'
import { useSettings } from '@/modules/userSettings'
import { Block, Document } from '@ttab/elephant-api/newsdoc'

export interface UserPreferences {
  nynorskPrefs: string | undefined
}

const NYNORSK_DOCUMENT_TYPE = 'ntb/nynorsk'

export function useUserPreferences(): {
  preferences: UserPreferences
  isLoading: boolean
  updateNynorskPrefs: (prefs: string) => Promise<void>
} {
  const { settings: nynorskSettings, isLoading, updateSettings: updateNynorskSettings } = useSettings(NYNORSK_DOCUMENT_TYPE)

  const preferences = useMemo<UserPreferences>(() => {
    const meta = nynorskSettings?.meta
    if (!Array.isArray(meta)) {
      return { nynorskPrefs: undefined }
    }

    const nynorskBlock = meta.find((block) => block.type === NYNORSK_DOCUMENT_TYPE)
    return {
      nynorskPrefs: nynorskBlock?.data?.rule_string || undefined
    }
  }, [nynorskSettings])

  const updateNynorskPrefs = useCallback(async (prefs: string) => {
    const doc = Document.create({
      title: 'Nynorsk translation preferences',
      type: NYNORSK_DOCUMENT_TYPE,
      meta: [
        Block.create({
          type: NYNORSK_DOCUMENT_TYPE,
          data: {
            rule_string: prefs
          }
        })
      ]
    })

    await updateNynorskSettings(doc)
  }, [updateNynorskSettings])

  return { preferences, isLoading, updateNynorskPrefs }
}
