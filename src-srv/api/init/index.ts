export async function GET(): Promise<unknown> {
  const INDEX_URL = process.env.INDEX_URL
  const WS_URL = process.env.WS_URL
  const CONTENT_API_URL = process.env.CONTENT_API_URL
  return {
    payload: {
      INDEX_URL,
      WS_URL,
      CONTENT_API_URL
    }
  }
}
