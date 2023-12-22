export async function GET(): Promise<unknown> {
  const INDEX_URL = process.env.INDEX_URL
  const WS_URL = process.env.WS_URL
  return {
    payload: {
      INDEX_URL,
      WS_URL
    }
  }
}
