import { SearchInput } from '@/components/SearchInput'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ttab/elephant-ui'
import React, { useState, type Dispatch, type SetStateAction, type JSX } from 'react'
import type { MediaTypes } from '..'
import { NTB_DISTRIBUTORS, type NTBDistributor } from '../lib/ntbFetcher'
import { useTranslation } from 'react-i18next'

const ALL_DISTRIBUTORS = 'all'

export const ImageSearchInput = ({
  setQueryString,
  setMediaType,
  distributorNames,
  setDistributorNames,
  isNtb
}: {
  setQueryString: Dispatch<SetStateAction<string>>
  setMediaType: Dispatch<SetStateAction<MediaTypes>>
  distributorNames: NTBDistributor[]
  setDistributorNames: Dispatch<SetStateAction<NTBDistributor[]>>
  isNtb: boolean
}): JSX.Element => {
  const [query, setQuery] = useState('')
  const { t } = useTranslation()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setQueryString(query)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className='flex w-full items-center gap-2'
    >
      <SearchInput
        className='w-full text-sm'
        placeholder={t('views:search.placeholders.search')}
        name='imagesearch'
        onChange={(e) => setQuery(e.currentTarget.value)}
      />
      {isNtb
        ? (
            <Select
              value={distributorNames[0] ?? ALL_DISTRIBUTORS}
              onValueChange={(value) =>
                setDistributorNames(value === ALL_DISTRIBUTORS ? [] : [value as NTBDistributor])}
            >
              <SelectTrigger className='w-fit shrink-0'>
                <SelectValue placeholder={t('views:imageSearch.labels.distributor')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_DISTRIBUTORS}>
                  {t('views:imageSearch.labels.allDistributors')}
                </SelectItem>
                {NTB_DISTRIBUTORS.map((distributor) => (
                  <SelectItem key={distributor} value={distributor}>
                    {distributor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        : (
            <Select onValueChange={(option) => setMediaType(option as MediaTypes)}>
              <SelectTrigger className='w-fit shrink-0'>
                <SelectValue placeholder={t('views:imageSearch.labels.mediaType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='image'>{t('views:imageSearch.labels.image')}</SelectItem>
                <SelectItem value='graphic'>{t('views:imageSearch.labels.graphic')}</SelectItem>
              </SelectContent>
            </Select>
          )}
    </form>
  )
}
