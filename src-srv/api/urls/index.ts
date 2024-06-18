export async function GET(): Promise<unknown> {
  const repositoryEventsUrl = process.env.REPOSITORY_URL
    ? `${process.env.REPOSITORY_URL}/sse`
    : ''

  return {
    payload: {
      indexUrl: process.env.INDEX_URL ?? '',
      webSocketUrl: process.env.WS_URL ?? '',
      repositoryEventsUrl
    }
  }
}
