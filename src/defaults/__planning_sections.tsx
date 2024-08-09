/**
 * @deprecated
 */
import { type DefaultValueOption } from '@/types'

export const PlanningSections: DefaultValueOption[] = [
  {
    value: 'ef739bb6-7ba1-5d36-8aa0-f7dde302efa2',
    label: 'Utrikes',
    payload: {
      uuid: 'ef739bb6-7ba1-5d36-8aa0-f7dde302efa2',
      uri: 'sector://utr',
      type: 'tt/sector',
      title: 'Utrikes',
      rel: 'sector',
      value: 'UTR'
    },
    color: 'bg-[#BD6E11]'
  },
  {
    value: 'a64a109d-63b2-5c34-8d58-3d6c4ce1b8fd',
    label: 'Inrikes',
    payload: {
      uuid: 'a64a109d-63b2-5c34-8d58-3d6c4ce1b8fd',
      uri: 'sector://inr',
      type: 'tt/sector',
      title: 'Inrikes',
      rel: 'sector',
      value: 'INR'
    },
    color: 'bg-[#DA90E1]'
  },
  {
    value: 'a36ff853-9fb3-5950-8893-64ac699f5481',
    label: 'Sport',
    payload:
    {
      uuid: 'a36ff853-9fb3-5950-8893-64ac699f5481',
      uri: 'sector://spt',
      type: 'tt/sector',
      title: 'Sport',
      data: {},
      rel: 'sector',
      value: 'SPT',
      links: [],
      content: [],
      meta: []
    },
    color: 'bg-[#6CA8DF]'
  },
  {
    value: '1c0df6b4-d82e-5ae6-aaee-47e33c04ba5b',
    label: 'Kultur & Nöje',
    payload: {
      uuid: '1c0df6b4-d82e-5ae6-aaee-47e33c04ba5b',
      uri: 'sector://klt',
      type: 'tt/sector',
      title: 'Kultur och nöje',
      rel: 'sector',
      value: 'KLT'
    },
    color: 'bg-[#12E1D4]'
  },
  {
    value: '2c4bd9ba-8f59-5172-890b-bdb693d9c3fe',
    label: 'Ekonomi',
    payload: {
      uuid: '2c4bd9ba-8f59-5172-890b-bdb693d9c3fe',
      uri: 'sector://eko',
      type: 'tt/sector',
      title: 'Ekonomi',
      rel: 'sector',
      value: 'EKO'
    },
    color: 'bg-[#FFB9B9]'
  }
]
