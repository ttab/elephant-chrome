export async function GET(): Promise<unknown> {
  return {
    payload: {
      indexUrl: process.env.INDEX_URL ?? '',
      webSocketUrl: process.env.WS_URL ?? '',
      repositoryUrl: process.env.REPOSITORY_URL ?? '',
      contentApiUrl: process.env.CONTENT_API_URL ?? ''
    }
  }
}
