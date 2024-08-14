import { Block } from '@/protos/service'
/**
 * @deprecated
 */
import { type DefaultValueOption } from '@/types'

export const EventsSections: DefaultValueOption[] = [
  {
    value: 'SPT',
    label: 'Sport',
    payload: Block.create(
      {
        uri: 'sector://spt',
        type: 'tt/sector',
        title: 'Sport',
        data: {},
        rel: 'sector',
        value: 'SPT',
        links: [],
        content: [],
        meta: []
      }),
    color: 'bg-[#6CA8DF]'
  },
  {
    value: 'KLT',
    label: 'Kultur & nöje',
    payload: Block.create({
      uri: 'sector://klt',
      type: 'tt/sector',
      title: 'Kultur och nöje',
      rel: 'sector',
      value: 'KLT'
    }),
    color: 'bg-[#12E1D4]'
  },
  {
    value: 'EKO',
    label: 'Ekonomi',
    payload: Block.create({
      uri: 'sector://eko',
      type: 'tt/sector',
      title: 'Ekonomi',
      rel: 'sector',
      value: 'EKO'
    }),
    color: 'bg-[#FFB9B9]'
  },
  {
    value: 'INR',
    label: 'Inrikes',
    payload: Block.create({
      uri: 'sector://inr',
      type: 'tt/sector',
      title: 'Inrikes',
      rel: 'sector',
      value: 'INR'
    }),
    color: 'bg-[#DA90E1]'
  },
  {
    value: 'UTR',
    label: 'Utrikes',
    payload: Block.create({
      uri: 'sector://utr',
      type: 'tt/sector',
      title: 'Utrikes',
      rel: 'sector',
      value: 'UTR'
    }),
    color: 'bg-[#BD6E11]'
  }
]
