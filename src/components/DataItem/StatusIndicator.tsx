import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent
} from '@ttab/elephant-ui'

import { cn } from '@ttab/elephant-ui/utils'
import { cva } from 'class-variance-authority'

export const StatusIndicator = ({ internal }: { internal: boolean }): JSX.Element => {
  const status = cva('flex items-center h-2 w-2 rounded-full mx-4', {
    variants: {
      internal: {
        true: 'border',
        false: 'bg-[#5895FF]'
      }
    }
  })

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className={cn(
            status({ internal })
          )} />
        </TooltipTrigger>

        <TooltipContent>
          <p>{internal ? 'Internal' : 'Public'}</p>
        </TooltipContent>

      </Tooltip>
    </TooltipProvider>
  )
}

// export const title: ColumnDef<Planning> = {
//   id: 'title',
//   accessorFn: (data) => data._source['document.title'][0],
//   cell: ({ row }) => {
//     const status = row.original._source['document.meta.core_planning_item.data.public'][0] === 'true'
//     const slugline = row.original._source['document.meta.core_assignment.meta.tt_slugline.value']
//     const classNames = cn('flex items-center h-2 w-2 rounded-full mx-4', status
//       ? 'bg-[#5895FF]'
//       : 'border')

//     return (
//       <div className='flex space-x-2 w-fit'>
//         <TooltipProvider>
//           <Tooltip>
//             <TooltipTrigger>
//               <div className={classNames} />
//             </TooltipTrigger>
//             <TooltipContent>
//               <p>{status ? 'Public' : 'Internal'}</p>
//             </TooltipContent>
//           </Tooltip>
//         </TooltipProvider>
//         <span className='max-w-[200px] md:max-w-[300px] lg:max-w-[700px] truncate font-medium'>
//           {row.getValue('title')}
//         </span>
//         {!!slugline?.length && (
//           <span className='hidden font-medium text-slate-500 lg:block'>{slugline[0]}</span>
//         )}
//       </div>
//     )
//   }
// }
