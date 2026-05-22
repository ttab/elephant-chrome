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
  const {
    settings: nynorskSettings,
    isLoading,
    updateSettings: updateNynorskSettings,
    deleteSettings: deleteNynorskSettings
  } = useSettings(NYNORSK_DOCUMENT_TYPE)

  const preferences = useMemo<UserPreferences>(() => {
    const meta = nynorskSettings?.meta
    if (!Array.isArray(meta)) {
      return { nynorskPrefs: undefined }
    }

    const nynorskBlock = meta.find((block) => block.type === NYNORSK_DOCUMENT_TYPE)
    // Empty or whitespace-only rule_string is treated as "no prefs" so every
    // caller can use `!!preferences.nynorskPrefs` without re-trimming.
    const ruleString = nynorskBlock?.data?.rule_string?.trim()
    return {
      nynorskPrefs: ruleString || undefined
    }
  }, [nynorskSettings])

  const updateNynorskPrefs = useCallback(async (prefs: string) => {
    // Preserve any unrelated meta blocks that may live in the same document
    // alongside the nynorsk block - we only own the block keyed by
    // NYNORSK_DOCUMENT_TYPE.
    const existing = Array.isArray(nynorskSettings?.meta) ? nynorskSettings.meta : []
    const otherBlocks = existing.filter((block) => block.type !== NYNORSK_DOCUMENT_TYPE)

    // The backend rejects an empty rule_string, so clearing prefs removes the
    // nynorsk block entirely. If nothing else remains, delete the document.
    if (!prefs.trim()) {
      if (otherBlocks.length === 0) {
        await deleteNynorskSettings()
        return
      }

      const doc = Document.create({
        title: 'Nynorsk translation preferences',
        type: NYNORSK_DOCUMENT_TYPE,
        meta: otherBlocks
      })
      await updateNynorskSettings(doc)
      return
    }

    const doc = Document.create({
      title: 'Nynorsk translation preferences',
      type: NYNORSK_DOCUMENT_TYPE,
      meta: [
        ...otherBlocks,
        Block.create({
          type: NYNORSK_DOCUMENT_TYPE,
          data: {
            rule_string: prefs
          }
        })
      ]
    })

    await updateNynorskSettings(doc)
  }, [nynorskSettings, updateNynorskSettings, deleteNynorskSettings])

  return { preferences, isLoading, updateNynorskPrefs }
}
