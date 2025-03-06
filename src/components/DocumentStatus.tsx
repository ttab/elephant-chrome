import { Button } from '@ttab/elephant-ui'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@ttab/elephant-ui'
import { Check, ChevronDown } from 'lucide-react'
import { useRef, useState, useEffect } from 'react'
import { useWorkflow } from '@/hooks/index/useWorkflow'

export const DocumentStatus = ({ type }: {
  type: string
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dropdownWidth, setDropdownWidth] = useState<number>(0)
  const workflow = useWorkflow(type)

  useEffect(() => {
    if (containerRef.current) {
      setDropdownWidth(containerRef.current.offsetWidth)
    }
  }, [])

  const currentStatus = 'done'
  console.log('Workflow: ', workflow)

  return (
    <div className='flex items-center' ref={containerRef}>

      <Button
        size='sm'
        className='h-8 rounded-r-none border-r border-neutral-400'
        onClick={() => console.log('Default action triggered')}
      >
        Klarmarkera
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size='sm' className='h-8 rounded-l-none px-2'>
            <ChevronDown size={16} />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className='w-full' align='end' sideOffset={0} style={{ minWidth: `${dropdownWidth}px` }}>
          {(workflow?.statuses || []).map((status) => {
            return (
              <DropdownMenuItem
                key={status.value}
                className='flex flex-row gap-4 w-full'
                onClick={() => console.log('Option 1 selected')}
              >
                <span className='w-3 grow-0 shrink-0'>
                  {(currentStatus && currentStatus === status.value) && <Check size={16} strokeWidth={2.15} className='opacity-90' />}
                </span>

                <span className='w-4 grow-0 shrink-0'>
                  {!!status.icon && <status.icon size={18} {...status.iconProps} />}
                </span>

                <span className='grow'>
                  {status.actionLabel}
                </span>

              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
