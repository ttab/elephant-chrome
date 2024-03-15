import { useEffect, useRef, useState } from 'react'
import { useYObserver } from '@/hooks'
import { Textarea } from '@ttab/elephant-ui'
import { Awareness } from '@/components'
import { MessageCircleMore } from '@ttab/elephant-ui/icons'
import { type Block } from '@/protos/service'
import { Textbit } from '@ttab/textbit'
import { type Descendant, Text } from 'slate'
import { useSlateSelection } from 'slate-react'
import { cva } from 'class-variance-authority'
import { cn } from '@ttab/elephant-ui/utils'

const PlanDescription = ({ role, index }: { role: string, index?: number }): JSX.Element | undefined => {
  const { get, set, loading } = useYObserver('planning', `meta.core/description[${index}].data`)

  const setFocused = useRef<(value: boolean) => void>(null)
  const placeholder = role === 'public' ? 'Public description' : 'Internal message'

  if (loading) {
    return undefined
  }


  return (
    <div className='flex w-full'>
      <Textbox
        initialText={get('text') as string || ''}
        onChange={text => {
          set(text, 'text')
        }}
      />
    </div>
  )

  // return (
  //   <Awareness name={'PlanDescription'} ref={setFocused}>
  //     <div className='flex w-full'>
  //       {role === 'internal' &&
  //         <MessageCircleMore
  //           size={28}
  //           strokeWidth={1.75}
  //           className='pr-2 text-muted-foreground'
  //         />}
  //       <Textarea
  //         className='border-0 p-0 font-normal text-base '
  //         value={get('text') as string}
  //         placeholder={placeholder}
  //         onChange={(event) => set(event.target.value, 'text')}
  //         onFocus={() => {
  //           if (setFocused.current) {
  //             setFocused.current(true)
  //           }
  //         }}
  //         onBlur={() => {
  //           if (setFocused.current) {
  //             setFocused.current(false)
  //           }
  //         }}
  //       />
  //     </div>
  //   </Awareness>
  // )
}

const Textbox = ({ initialText, onChange }: {
  initialText: string
  onChange: (value: string) => void
}): JSX.Element => {
  return (
    <Textbit.Root verbose={true} plugins={[]} className="h-min-12 w-full">
      <TextboxEditable initialText={initialText} onChange={onChange} />
    </Textbit.Root>
  )
}

const TextboxEditable = ({ initialText, onChange }: {
  initialText: string
  onChange: (value: string) => void
}): JSX.Element => {
  const [internalValue, setInternalValue] = useState<Descendant[]>(textToDescendant(initialText))

  useEffect(() => {
    setInternalValue(textToDescendant(initialText))
  }, [initialText])

  if (!internalValue.length) {
    return <></>
  }

  return (
    <Textbit.Editable
      className="outline-none rounded h-min-12 ring-offset-8 ring-offset-background data-[state='focused']:ring-2 ring-slate-400 data-[state='focused']:dark:ring-slate-200"
      value={internalValue}
      onChange={nodes => {
        const strValue = Object.values(nodes).map(node => {
          return descendantToText(node)
        }).join('\n')

        console.log(strValue, null, 2)
      }}
    />
  )
}

function textToDescendant(text: string): Descendant[] {
  // eslint-disable-next-line @typescript-eslint/quotes
  return text.split("\n")
    .filter(str => !!str.trim())
    .map(str => {
      return {
        type: 'core/text',
        id: crypto.randomUUID(),
        class: 'text',
        children: [{ text: str.trim() }]
      }
    })
}

function descendantToText(node: Descendant | Text): string {
  if (Text.isText(node)) {
    return node.text
  }

  const { children } = node
  // eslint-disable-next-line @typescript-eslint/quotes
  return Object.values(children || {}).map(node => descendantToText(node)).join("\n")
}

export const PlanDescriptions = (): JSX.Element => {
  const { state } = useYObserver('planning', 'meta.core/description')

  const newPublicDescription = isPlaceholderNeeded(state, 'public') &&
    <PlanDescription key='newPublic' role='public' />
  const newInternalMessage = isPlaceholderNeeded(state, 'internal') &&
    <PlanDescription key='newInternal ' role='internal' />


  const sortedDescriptions = (Array.isArray(state)
    ? state.map((description: Block, index: number) => {
      return <PlanDescription key={index} index={index} role={description.role} />
    })
    : [])
    .sort((componentA: JSX.Element, componentB: JSX.Element) => {
      const roleOrder = { public: 0, internal: 1 }

      const roleA: keyof typeof roleOrder = componentA.props.role
      const roleB: keyof typeof roleOrder = componentB.props.role

      return roleOrder[roleA] - roleOrder[roleB]
    })

  return (
    <div className='flex flex-col gap-4'>
      {...[
        newPublicDescription,
        ...sortedDescriptions,
        newInternalMessage
      ].filter(x => x)}
    </div>
  )
}

function isPlaceholderNeeded(state: Block | Block[] | undefined, role: string): boolean {
  if (Array.isArray(state)) {
    return !state.some((d: Block) => d.role === role)
  } else {
    return true
  }
}
