import { getAssignmentTypes } from '@/defaults/assignmentTypes'
import { setImageSearchProvider } from '@/shared/getImageSearchProvider'
import { VideoIcon, ApertureIcon } from '@ttab/elephant-ui/icons'

afterEach(() => {
  setImageSearchProvider('')
})

describe('getAssignmentTypes', () => {
  it('returns the default TT list when the image search provider is not ntb', () => {
    const values = getAssignmentTypes().map((type) => type.value)

    expect(values).toContain('graphic')
    expect(values).toContain('picture/video')
    expect(values).not.toContain('live-streaming')

    const video = getAssignmentTypes().find((type) => type.value === 'video')
    expect(video?.icon).toBe(VideoIcon)
  })

  it('returns the NTB list when the image search provider is ntb', () => {
    setImageSearchProvider('ntb')

    const values = getAssignmentTypes().map((type) => type.value)

    expect(values).not.toContain('graphic')
    expect(values).not.toContain('picture/video')
    expect(values).toContain('live-streaming')

    const video = getAssignmentTypes().find((type) => type.value === 'video')
    expect(video?.icon).toBe(ApertureIcon)

    const liveVideo = getAssignmentTypes().find((type) => type.value === 'live-streaming')
    expect(liveVideo?.icon).toBe(VideoIcon)
  })

  it('falls back to the default list for any non-ntb provider', () => {
    setImageSearchProvider('tt')

    const values = getAssignmentTypes().map((type) => type.value)

    expect(values).toContain('picture/video')
    expect(values).not.toContain('live-streaming')
  })
})
