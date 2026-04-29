import { useState, type JSX } from 'react'
import { Button } from '@ttab/elephant-ui'
import { ChevronDownIcon, ChevronUpIcon } from '@ttab/elephant-ui/icons'
import { useTranslation } from 'react-i18next'
import type { SearchFieldConfig } from './types'

interface SyntaxHelpProps {
  fields: SearchFieldConfig[]
}

export const SyntaxHelp = ({ fields }: SyntaxHelpProps): JSX.Element => {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)

  const entries = [
    { label: t('advancedSearch.syntaxOperators'), value: t('advancedSearch.syntaxOperatorsValue') },
    { label: t('advancedSearch.syntaxPhrase'), value: t('advancedSearch.syntaxPhraseValue') },
    { label: t('advancedSearch.syntaxWildcard'), value: t('advancedSearch.syntaxWildcardValue') },
    { label: t('advancedSearch.syntaxFuzzy'), value: t('advancedSearch.syntaxFuzzyValue') },
    { label: t('advancedSearch.syntaxGrouping'), value: t('advancedSearch.syntaxGroupingValue') },
    { label: t('advancedSearch.syntaxFieldSearch'), value: t('advancedSearch.syntaxFieldSearchValue') }
  ]

  return (
    <div className='text-xs text-muted-foreground'>
      <Button
        variant='ghost'
        size='xs'
        onClick={() => setExpanded(!expanded)}
        className='flex items-center gap-1 px-0 h-6 text-xs text-muted-foreground'
      >
        {expanded
          ? <ChevronUpIcon size={14} />
          : <ChevronDownIcon size={14} />}
        {t('advancedSearch.syntaxReference')}
      </Button>

      {expanded && (
        <div className='mt-2 space-y-2 rounded-md border p-3 text-xs'>
          {entries.map((entry) => (
            <div key={entry.label}>
              <span className='font-medium'>
                {entry.label}
                {': '}
              </span>
              {entry.value}
            </div>
          ))}

          {fields.length > 0 && (
            <div className='pt-1 border-t'>
              <span className='font-medium'>
                {t('advancedSearch.syntaxAvailableFields')}
                :
              </span>
              <div className='mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5'>
                {fields.map((f) => (
                  <div key={f.syntaxAlias}>
                    <code className='text-[11px] bg-muted px-1 rounded'>
                      {f.syntaxAlias}
                    </code>
                    {' '}
                    {(t as (k: string) => string)(f.labelKey)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
