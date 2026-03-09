import type app from '../locales/en/app.json'
import type common from '../locales/en/common.json'
import type core from '../locales/en/core.json'
import type editor from '../locales/en/editor.json'
import type errors from '../locales/en/errors.json'
import type event from '../locales/en/event.json'
import type factbox from '../locales/en/factbox.json'
import type flash from '../locales/en/flash.json'
import type metaSheet from '../locales/en/metaSheet.json'
import type planning from '../locales/en/planning.json'
import type quickArticle from '../locales/en/quickArticle.json'
import type shared from '../locales/en/shared.json'
import type views from '../locales/en/views.json'
import type wires from '../locales/en/wires.json'
import type workflows from '../locales/en/workflows.json'

// Recursively generate all dot-notation leaf key paths for a JSON namespace object.
type LeafPaths<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends Record<string, unknown>
    ? LeafPaths<T[K], `${Prefix}${K}.`>
    : `${Prefix}${K}`
}[keyof T & string]

type I18nResources = {
  app: typeof app
  common: typeof common
  core: typeof core
  editor: typeof editor
  errors: typeof errors
  event: typeof event
  factbox: typeof factbox
  flash: typeof flash
  metaSheet: typeof metaSheet
  planning: typeof planning
  quickArticle: typeof quickArticle
  shared: typeof shared
  views: typeof views
  wires: typeof wires
  workflows: typeof workflows
}

/**
 * Union of all valid translation keys across every namespace.
 * Includes both bare keys (e.g. "actions.abort") and ns-prefixed keys
 * (e.g. "common:actions.abort"). An invalid key like "mainMenu.stuff"
 * or "app:mainMenu.stuff" is NOT in this union → TypeScript error.
 */
export type TranslationKey = {
  [NS in keyof I18nResources]:
    | LeafPaths<I18nResources[NS]>
    | `${NS}:${LeafPaths<I18nResources[NS]>}`
}[keyof I18nResources]

/**
 * Maps a string key to itself if valid, or to an error-message literal if not.
 * This causes TypeScript to report `'"❌ Invalid translation key: \"foo\""'` in
 * the error instead of the full TranslationKey union.
 */
type ValidKey<K extends string> = K extends TranslationKey
  ? K
  : `❌ Invalid translation key: "${K}"`

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common'
    resources: I18nResources
  }

  /**
   * Augmented overloads added to TFunction so that cross-namespace t('ns:key')
   * calls work without declaring namespaces in useTranslation([...]).

   *
   * Later-declared interface members have higher overload priority in TypeScript,
   * so these are tried first. Genuinely missing static keys are caught as errors.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TFunction<Ns, KPrefix> {
    <const K extends string>(key: ValidKey<K> | ValidKey<K>[], options?: Record<string, unknown>): string
    <const K extends string>(key: ValidKey<K> | ValidKey<K>[], defaultValue?: string, options?: Record<string, unknown>): string
  }
}
