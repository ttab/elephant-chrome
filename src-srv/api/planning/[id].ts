import type { Request } from 'express'

export async function GET(req: Request): Promise<unknown> {
  return {
    payload: {
      id: req.params.id
    }
  }
}
