interface CollaborationDefaults {
  colors: Record<string, {
    ring: string
    border: string
    bg: string
  }>
}

export const Collaboration: CollaborationDefaults = {
  colors: {
    'rgb(248 113 113)': {
      ring: 'ring-red-400',
      border: 'border-red-400',
      bg: 'bg-red-300'
    },
    'rgb(251 146 60)': {
      ring: 'ring-orange-400',
      border: 'border-orange-400',
      bg: 'bg-orange-300'
    },
    'rgb(251 191 36)': {
      ring: 'ring-amber-400',
      border: 'border-amber-400',
      bg: 'bg-amber-300'
    },
    'rgb(163 230 53)': {
      ring: 'ring-lime-400',
      border: 'border-lime-400',
      bg: 'bg-lime-300'
    },
    'rgb(6 182 212)': {
      ring: 'ring-cyan-400',
      border: 'border-cyan-400',
      bg: 'bg-cyan-300'
    },
    'rgb(52 211 153)': {
      ring: 'ring-emerald-400',
      border: 'border-emerald-400',
      bg: 'bg-emerald-300'
    },
    'rgb(45 212 191)': {
      ring: 'ring-teal-400',
      border: 'border-teal-400',
      bg: 'bg-teal-300'
    },
    'rgb(167 139 250)': {
      ring: 'ring-violet-400',
      border: 'border-violet-400',
      bg: 'bg-violet-300'
    },
    'rgb(192 132 252)': {
      ring: 'ring-purple-400',
      border: 'border-purple-400',
      bg: 'bg-purple-300'
    },
    'rgb(232 121 249)': {
      ring: 'ring-fuchsia-400',
      border: 'border-fuchsia-400',
      bg: 'bg-fuchsia-300'
    },
    'rgb(251 113 133)': {
      ring: 'ring-rose-400',
      border: 'border-rose-400',
      bg: 'bg-rose-300'
    },
    default: {
      ring: 'ring-indigo-400',
      border: 'border-indigo-400',
      bg: 'bg-indigo-300'
    }
  }
}
