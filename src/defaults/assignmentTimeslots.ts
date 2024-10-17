export interface Slots extends Record<string, { slots: number[], label: string }> {}

export const timesSlots: Slots = {
  fullday: {
    slots: [],
    label: 'Heldag'
  },
  morning: {
    slots: [5, 6, 7, 8, 9],
    label: 'Morgon'
  },
  forenoon: {
    slots: [10, 11, 12],
    label: 'Förmiddag'
  },
  afternoon: {
    slots: [13, 14, 15, 16, 17],
    label: 'Eftermiddag'
  },
  evening: {
    slots: [18, 19, 20, 21, 22, 23],
    label: 'Kväll'
  }
}

export const slotLabels = [
  { value: 'fullday', label: 'Heldag' },
  { value: 'morning', label: 'Morgon' },
  { value: 'afternoon', label: 'Eftermiddag' },
  { value: 'forenoon', label: 'Förmiddag' },
  { value: 'evening', label: 'Kväll' }
]
