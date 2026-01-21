import { Select, SelectContent, SelectItem, SelectTrigger } from '@ttab/elephant-ui'
import { useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'


export const LanguageSelector = (): JSX.Element => {
  const { i18n } = useTranslation()
  const [language, setLanguage] = useState('sv')

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'sv-se', label: 'Svenska' },
    { code: 'no', label: 'Norsk' }
  ]

  const changeLanguage = (value: string) => {
    i18n.changeLanguage(value).then(() => {
      setLanguage(value)
      console.log(`Language changed to: ${value}`)
    }).catch((err) => {
      console.error('Error changing language:', err)
    })
  }
  console.log(i18n.languages)

  return (
    <Select
      value={language}
      onValueChange={changeLanguage}
    >
      <SelectTrigger className='gap-1 w-fit justify-between border-none focus:ring-0'>
        {language}
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            {lang.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
