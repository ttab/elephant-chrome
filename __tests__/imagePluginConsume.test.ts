import type { Plugin } from '@ttab/textbit'
import type { Repository } from '@/shared/Repository'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { consume } from '@/views/PrintEditor/ImagePlugin/lib/consume'

const originalFileReader = globalThis.FileReader
const originalImage = globalThis.Image

const createResource = () => {
  const file = new File(['payload'], 'test-image.png', { type: 'image/png' })
  return {
    resource: {
      type: 'core/image',
      data: file
    } as Plugin.Resource,
    file
  }
}

type FileReaderMockConfig = {
  dataUrl?: string
  error?: DOMException
  abortSpy?: ReturnType<typeof vi.fn>
}

const installFileReaderMock = ({
  dataUrl = 'data:image/png;base64,AAA',
  error,
  abortSpy = vi.fn()
}: FileReaderMockConfig = {}) => {
  class FileReaderMock {
    public result: string | ArrayBuffer | null = null
    public onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null = null
    public onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null = null
    public error: DOMException | null = null
    public abort = abortSpy

    readAsDataURL() {
      if (error) {
        this.error = error
        const event = { target: { error } } as ProgressEvent<FileReader>
        this.onerror?.call(this as unknown as FileReader, event)
        return
      }

      this.result = dataUrl
      const event = { target: this } as unknown as ProgressEvent<FileReader>
      this.onload?.call(this as unknown as FileReader, event)
    }
  }

  globalThis.FileReader = FileReaderMock as unknown as typeof FileReader
  return { abortSpy }
}

type ImageMockConfig = {
  naturalWidth?: number
  naturalHeight?: number
  shouldError?: boolean
}

const installImageMock = ({
  naturalWidth = 1024,
  naturalHeight = 768,
  shouldError = false
}: ImageMockConfig = {}) => {
  class ImageMock {
    onload: (() => void) | null = null
    onerror: ((e: Event) => void) | null = null
    naturalWidth = naturalWidth
    naturalHeight = naturalHeight
    private _src = ''

    set src(value: string) {
      this._src = value
      queueMicrotask(() => {
        if (shouldError) {
          this.onerror?.(new Event('error'))
          return
        }
        this.onload?.()
      })
    }

    get src() {
      return this._src
    }
  }

  globalThis.Image = ImageMock as unknown as typeof Image
}

describe('ImagePlugin consume error handling', () => {
  let uploadFile: ReturnType<typeof vi.fn>
  let repository: Repository

  beforeEach(() => {
    vi.clearAllMocks()
    uploadFile = vi.fn().mockResolvedValue({
      uuid: 'mock-uuid',
      name: 'uploaded-image.png'
    })
    repository = { uploadFile } as unknown as Repository
  })

  afterEach(() => {
    if (originalFileReader) {
      globalThis.FileReader = originalFileReader
    }
    if (originalImage) {
      globalThis.Image = originalImage
    }
  })

  it('rejects when FileReader emits an error', async () => {
    const readerError = new DOMException('mock read failure', 'NotReadableError')
    const abortSpy = vi.fn()

    installFileReaderMock({ error: readerError, abortSpy })
    installImageMock({ naturalWidth: 800, naturalHeight: 600 })

    const { resource, file } = createResource()
    await expect(consume(resource, repository)).rejects.toThrow('mock read failure')
    expect(uploadFile).toHaveBeenCalledWith('test-image.png', 'image/png', file, expect.any(String))
    expect(abortSpy).toHaveBeenCalledTimes(1)
  })

  it('rejects when the uploaded image fails to load', async () => {
    installFileReaderMock()
    installImageMock({ naturalWidth: 0, naturalHeight: 0, shouldError: true })

    const { resource } = createResource()
    await expect(consume(resource, repository)).rejects.toThrow('Image failed to load')
    expect(uploadFile).toHaveBeenCalledTimes(1)
  })

  it('resolves with an image resource when upload and decoding succeed', async () => {
    installFileReaderMock()
    installImageMock({ naturalWidth: 1024, naturalHeight: 768 })

    const { resource } = createResource()

    const result = await consume(resource, repository)

    expect(result?.type).toBe('core/image')
    const data = result?.data as Plugin.Resource
    expect(data).toMatchObject({
      type: 'core/image',
      properties: {
        uploadId: 'mock-uuid',
        uri: 'core://image/mock-uuid',
        title: 'uploaded-image.png'
      }
    })
  })

  it('rejects when uploadFile fails and surfaces the toast error', async () => {
    uploadFile.mockRejectedValueOnce(new Error('network down'))

    const { resource } = createResource()
    await expect(consume(resource, repository)).rejects.toThrow('could not upload file')

    expect(uploadFile).toHaveBeenCalledTimes(1)
  })
})
