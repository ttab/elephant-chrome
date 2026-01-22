import { Select, SelectContent, SelectItem, SelectTrigger } from '@ttab/elephant-ui'
import { LanguagesIcon } from 'lucide-react'
import { type JSX } from 'react'
import { useTranslation } from 'react-i18next'


export const LanguageSelector = (): JSX.Element => {
  const { i18n } = useTranslation()

  const languages = [
    { code: 'sv', short: 'sv', label: 'Svenska' },
    { code: 'nb', short: 'nb', label: 'Norsk bokmål' }
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
      <SelectTrigger className='p-0 m-0 w-fit max-w-30 text-xs justify-center border-0 focus:ring-0'>
        <div className='mr-1.5 hidden md:block'><LanguagesIcon size={16} strokeWidth={1.75} /></div>
        {languages.find((lang) => lang.code === i18n.language)?.short.toUpperCase()}
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
