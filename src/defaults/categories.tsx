import { type ColumnValueOption } from '@/types'
import { Shapes } from '@ttab/elephant-ui/icons'

export const Categories: ColumnValueOption[] = [
  {
    value: 'Politik',
    label: 'Politik',
    payload: {
      uuid: 'df76e035-7b92-5d1d-a3b0-77e2fb56b9df',
      uri: 'iptc://mediatopic/11000000',
      type: 'core/category',
      title: 'Politik',
      rel: 'category'
    },
    icon: Shapes
  },
  {
    value: 'Brott, lag och rätt',
    label: 'Brott, lag och rätt',
    payload: {
      uuid: '7f4ea480-f800-5b7a-bbd8-2bde519bbf29',
      uri: 'iptc://mediatopic/02000000',
      type: 'core/category',
      title: 'Brott, lag och rätt',
      rel: 'category'
    },
    icon: Shapes
  },
  {
    value: 'Ekonomi, affärer och finans',
    label: 'Ekonomi, affärer och finans',
    payload: {
      type: 'core/category',
      uuid: '0cc646a0-f9a0-5aaf-9530-33783461e387',
      uri: 'iptc://mediatopic/04000000',
      title: 'Ekonomi, affärer och finans',
      rel: 'category'
    },
    icon: Shapes
  },
  {
    value: 'Fotboll',
    label: 'Fotboll',
    payload: {
      uuid: 'f1508161-1b84-5da0-a457-7658c03a2386',
      uri: 'iptc://mediatopic/20001065',
      type: 'core/category',
      title: 'Fotboll',
      rel: 'category'
    },
    icon: Shapes
  },
  {
    value: 'Krig, konflikter och oroligheter',
    label: 'Krig, konflikter och oroligheter',
    payload: {
      uuid: '64e7fae7-96d3-50d2-8905-bbb4fd09f67f',
      uri: 'iptc://mediatopic/16000000',
      title: 'Krig, konflikter och oroligheter',
      rel: 'category'
    },
    icon: Shapes
  }
]
