let imageSearchProvider = ''

export function setImageSearchProvider(value: string): void {
  imageSearchProvider = value
}

export function getImageSearchProvider(): string {
  return imageSearchProvider
}

// TODO: consider reading from TENANT env instead in the future
export function isNtb(): boolean {
  return imageSearchProvider === 'ntb'
}
