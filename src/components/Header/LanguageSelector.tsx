import { Select, SelectContent, SelectItem, SelectTrigger } from '@ttab/elephant-ui'
import { LanguagesIcon } from 'lucide-react'
import { type JSX } from 'react'
import { useTranslation } from 'react-i18next'


export const LanguageSelector = (): JSX.Element => {
  const { i18n } = useTranslation()

  const languages = [
    { code: 'sv-SE', label: 'Svenska' },
    { code: 'no', label: 'Norsk bokmål' }
  ]

  const changeLanguage = (value: string) => {
    i18n.changeLanguage(value).then(() => {
    }).catch((err) => {
      console.error('Error changing language:', err)
    })
  }

  return (
    <Select
      value={i18n.language}
      onValueChange={changeLanguage}
    >
      <SelectTrigger className='max-w-30 text-xs justify-center border-0 focus:ring-0'>
        <div className='mr-1.5'><LanguagesIcon size={18} strokeWidth={1.75} /></div>
        {languages.find((lang) => lang.code === i18n.language)?.label}
      </SelectTrigger>
      <SelectContent id='language-selector'>
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            {lang.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
