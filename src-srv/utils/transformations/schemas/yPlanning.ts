import { z } from 'zod'
import { type Block } from '../../../protos/service.js'

export interface BlockPlanning extends Omit<Block, 'meta' | 'links' | 'content'> {
  links: Record<string, BlockPlanning[]>
  content: Record<string, BlockPlanning[]>
  meta: Record<string, BlockPlanning[]>
}

const BlockSchema: z.ZodType<BlockPlanning> = z.lazy(() =>
  z.object({
    id: z.string(),
    uuid: z.string()
      .uuid()
      .or(z.literal('')),
    uri: z.string(),
    url: z.string()
      .url()
      .or(z.literal('')),
    type: z.string(),
    title: z.string(),
    data: z.record(
      z.string()
    ),
    rel: z.string(),
    role: z.string(),
    name: z.string(),
    value: z.string(),
    contentType: z.string(),
    links: z.record(
      z.array(
        BlockSchema
      )
    ),
    content: z.record(
      z.array(
        BlockSchema
      )
    ),
    meta: z.record(
      z.array(
        BlockSchema
      )
    )
  }).strict()
)

export const yPlanningSchema = z.object({
  meta: z.record(z.array(BlockSchema)),
  links: z.record(z.array(BlockSchema)),
  root: z.object({
    title: z.string()
  }).strict()
}).strict()

export type YPlanning = z.infer<typeof yPlanningSchema>
