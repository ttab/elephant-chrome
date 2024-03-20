import { type YObserved } from '@/hooks/useYObserver'
import { Textbit } from '@ttab/textbit'
import { type Descendant, Text } from 'slate'
import { cva } from 'class-variance-authority'
import { cn } from '@ttab/elephant-ui/utils'

export const TextBox = ({ yObserver, icon, placeholder }: {
  yObserver: YObserved
  icon?: React.ReactNode
  placeholder?: string
}): JSX.Element => {
  return (
    <Textbit.Root
      verbose={true}
      debounce={0}
      placeholders={false}
      plugins={[]}
      className="h-min-12 w-full"
    >
      <TextboxEditable
        yObserver={yObserver}
        icon={icon}
        placeholder={placeholder}
      />
    </Textbit.Root>
  )
}

const TextboxEditable = ({ icon, placeholder, yObserver }: {
  yObserver: YObserved
  icon?: React.ReactNode
  placeholder?: string
}): JSX.Element | undefined => {
  const { get, set, state, loading } = yObserver

  if (loading) {
    return undefined
  }
  const text = get('text') as string || ''

  const wrapperStyle = cva('absolute top-0 left-0 p-2 -mt-2 -ml-2 text-muted-foreground', {
    variants: {
      hasIcon: {
        true: 'flex flex-row'
      }
    }
  })

  const placeholderStyle = cva('transition-opacity delay-0 duration-75', {
    variants: {
      showPlaceholder: {
        true: 'opacity-70',
        false: 'opacity-0'
      }
    }
  })

  const editableStyle = cva('relative outline-none rounded-sm h-min-12 p-2 -mt-2 -ml-2 ring-offset-background data-[state="focused"]:ring-1 ring-gray-300 data-[state="focused"]:dark:ring-gray-600', {
    variants: {
      hasIcon: {
        true: 'ps-9'
      }
    }
  })

  const hasIcon = !!icon

  return (
    <div>
      <div className={cn(wrapperStyle({ hasIcon }))}>
        {icon}
        <div className={cn(placeholderStyle({ showPlaceholder: !text?.trim() }))}>
          {placeholder || ''}
        </div>
      </div>

      <Textbit.Editable
        className={cn(editableStyle({ hasIcon }))}
        value={textToDescendant(text)}
        onChange={nodes => {
          if (state) {
            const strValue = Object.values(nodes).map(node => {
              return descendantToText(node)
            }).join('\n')
            set(strValue, 'text')
          } else {
            // TODO: Need to handle when an entry does not exist in ymap
            // set([{ `meta.core / description[${ index }].data`: text }])
          }
        }}
      />
    </div>
  )
}

function textToDescendant(text: string): Descendant[] {
  // eslint-disable-next-line @typescript-eslint/quotes
  return text.split("\n")
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
