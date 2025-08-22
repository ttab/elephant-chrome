export const GET = (): Promise<unknown> => {
  return Promise.resolve({
    payload: {
      indexUrl: process.env.INDEX_PUBLIC_URL ?? process.env.INDEX_URL ?? '',
      webSocketUrl: process.env.WS_URL ?? '',
      repositoryUrl: process.env.REPOSITORY_PUBLIC_URL ?? process.env.REPOSITORY_URL ?? '',
      userUrl: process.env.USER_PUBLIC_URL ?? process.env.USER_URL ?? '',
      contentApiUrl: process.env.CONTENT_API_PUBLIC_URL ?? process.env.CONTENT_API_URL ?? '',
      spellcheckUrl: process.env.SPELLCHECK_PUBLIC_URL ?? process.env.SPELLCHECK_URL ?? '',
      faroUrl: process.env.FARO_PUBLIC_URL ?? process.env.FARO_URL ?? '',
      baboonUrl: process.env.BABOON_PUBLIC_URL ?? process.env.BABOON_URL ?? ''
    }
  })
}
