import { Button } from '@ttab/elephant-ui'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@ttab/elephant-ui'
import { ChevronDown } from 'lucide-react'
import { useRef, useState, useEffect } from 'react'
import { useWorkflow } from '@/hooks/index/useWorkflow'
import { cn } from '@ttab/elephant-ui/utils'

export const DocumentStatus = ({ type }: {
  type: string
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dropdownWidth, setDropdownWidth] = useState<number>(0)
  const { statuses, workflow } = useWorkflow(type)

  useEffect(() => {
    if (containerRef.current) {
      setDropdownWidth(containerRef.current.offsetWidth)
    }
  }, [])

  const currentStatus = 'done' as string
  const currentStatusDef = statuses[currentStatus]
  const transitions = workflow[currentStatus]?.transitions || {}
  const defaultTransitionStatus = Object.keys(transitions).find((status) => transitions[status].default)
  const defaultTransition = defaultTransitionStatus ? transitions[defaultTransitionStatus] : transitions[0]

  if (!Object.keys(transitions).length) {
    return <></>
  }

  const defaultStatusDef = defaultTransitionStatus ? statuses[defaultTransitionStatus] : undefined

  return (
    <div className='flex items-center' ref={containerRef}>

      <Button
        size='sm'
        className='h-8 rounded-r-none border-r flex flex-row gap-2'
        onClick={() => console.log('Default action triggered')}
        title={defaultTransition.description}
      >
        {!!defaultStatusDef?.icon && (
          <defaultStatusDef.icon
            size={18}
            strokeWidth={1.75}
            className={defaultStatusDef.className}
          />
        )}
        {defaultTransition.title}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size='sm' className='h-8 rounded-l-none px-2'>
            <ChevronDown size={16} />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className='w-full p-0' align='end' sideOffset={0} style={{ minWidth: `${dropdownWidth}px` }}>

          <div className='flex flex-row gap-4 p-4 bg-secondary text-secondary-foreground border-b'>
            <div className='w-4 grow-0 shrink-0 pt-0.5'>
              {!!currentStatusDef.icon && (
                <currentStatusDef.icon
                  size={24}
                  strokeWidth={1.75}
                  className={cn(
                    currentStatusDef.className,
                    '-ms-0.5 -mt-0.5'
                  )}
                />
              )}
            </div>

            <div className='grow flex flex-col gap-0.5'>
              <div className='font-bold'>{workflow[currentStatus].title}</div>
              <div className='text-sm'>{workflow[currentStatus].description}</div>
            </div>
          </div>

          <div className='p-2'>
            {Object.keys(transitions).map((status) => {
              const state = transitions[status]
              const statusDef = statuses[status]

              return (
                <DropdownMenuItem
                  key={status}
                  className='flex flex-row gap-4 w-full py-2 pe-2 items-start rounded-md'
                  onClick={() => console.log('Selected', state)}
                >
                  <div className='w-4 grow-0 shrink-0 pt-0.5'>
                    {!!statusDef.icon && (
                      <statusDef.icon
                        size={18}
                        strokeWidth={1.75}
                        className={statusDef.className}
                      />
                    )}
                  </div>

                  <div className='grow flex flex-col gap-0.5'>
                    <div className='font-semibold'>{state.title}</div>
                    <div className='w-full text-sm text-muted-foreground pe-2'>{state.description}</div>
                  </div>
                </DropdownMenuItem>
              )
            })}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
