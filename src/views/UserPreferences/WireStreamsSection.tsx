import { type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettings } from '@/modules/userSettings'
import { SpecificFilterValue } from '@/views/Wires/components/Filter/FilterValue'

interface MetaBlock {
  type?: string
  role?: string
  title?: string
  uuid?: string
  uri?: string
  value?: string
}

interface StreamContent {
  uuid: string
  title?: string
  meta?: MetaBlock[]
}

/**
 * Extract the actual value string for a meta block based on its type.
 * Wire panes store source URIs as `uri`, section IDs as `uuid`, and
 * everything else as `value`.
 */
function extractValue(block: MetaBlock): string | undefined {
  switch (block.type) {
    case 'core/source':
      return block.uri
    case 'core/section':
      return block.uuid
    default:
      return block.value
  }
}

export const WireStreamsSection = (): JSX.Element => {
  const { t } = useTranslation('app')
  const { settings, isLoading } = useSettings('core/wire-panes-setting')

  const streams: StreamContent[] = Array.isArray(settings?.content)
    ? (settings.content as StreamContent[])
    : []

  return (
    <section className='flex flex-col gap-2 py-4 border-b'>
      <h3 className='font-semibold text-base text-foreground'>
        {t('settings.wireStreams.title')}
      </h3>
      <p className='text-sm text-muted-foreground'>
        {t('settings.wireStreams.description')}
      </p>

      {isLoading && (
        <p className='text-sm text-muted-foreground italic'>
          {t('settings.loading')}
        </p>
      )}

      {!isLoading && streams.length === 0 && (
        <p className='text-sm text-muted-foreground italic'>
          {t('settings.wireStreams.empty')}
        </p>
      )}

      {streams.length > 0 && (
        <ul className='flex flex-col gap-2'>
          {streams.map((stream) => {
            const filterBlocks = (stream.meta ?? []).filter((b) => b.role === 'filter')

            // Group values by filter type
            const byType = filterBlocks.reduce<Map<string, string[]>>((acc, block) => {
              const type = block.type
              const value = extractValue(block)
              if (!type || value === undefined) return acc
              const list = acc.get(type) ?? []
              list.push(value)
              acc.set(type, list)
              return acc
            }, new Map())

            return (
              <li
                key={stream.uuid}
                className='flex flex-col gap-2 rounded-md border p-3 bg-gray-50 dark:bg-gray-900'
              >
                <div className='font-medium text-sm text-foreground'>
                  {stream.title || t('settings.wireStreams.untitled')}
                </div>

                {byType.size === 0
                  ? (
                      <span className='text-xs text-muted-foreground italic'>
                        {t('settings.wireStreams.noFilters')}
                      </span>
                    )
                  : (
                      <div className='flex flex-wrap gap-2 items-center'>
                        {Array.from(byType.entries()).map(([type, values]) => (
                          <div
                            key={type}
                            className='flex items-center text-xs px-2 py-1 rounded border bg-background'
                          >
                            <SpecificFilterValue type={type} values={values} />
                          </div>
                        ))}
                      </div>
                    )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
