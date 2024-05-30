import { type Request, type Response } from 'express'

export async function GET(req: Request, res: Response): Promise<unknown> {
  const INDEX_URL = process.env.INDEX_URL
  const WS_URL = process.env.WS_URL
  return {
    payload: {
      INDEX_URL,
      WS_URL
    }
  }
}
