import { useState, useRef, useLayoutEffect, useMemo, useSyncExternalStore } from 'react'
import { v4 as uuid } from 'uuid'

function ContentWrapper ({ children }: { children: JSX.Element }): JSX.Element {
  return useMemo(() => (
    <section className="flex-grow bg-gray-200 basis-full rounded-lg p-2 min-w-max">
      {children}
    </section>
  ), [children])
}

function Planning ({ text }: { text: string }): JSX.Element {
  return (
    <div className="w-96">
      <p className='font-bold'>
        {text}
      </p>
      <p>{Date.now().toString()}</p>
      <p>384px</p>
    </div>
  )
}

function Content ({ text }: { text: string }): JSX.Element {
  return (
    <div style={{ width: '750px' }}>
      <p className='font-bold'>{text}</p>
      <p>{Date.now()}</p>
      <p>750px</p>
    </div>
  )
}

function Small ({ text }: { text: string }): JSX.Element {
  return (
    <div style={{ width: '150px' }}>
      <p className='font-bold'>{text}</p>
      <p>{Date.now()}</p>
      <p>150px</p>
    </div>
  )
}

function Medium ({ text }: { text: string }): JSX.Element {
  return (
    <div style={{ width: '450px' }}>
      <p className='font-bold'>{text}</p>
      <p>{Date.now()}</p>
      <p>450px</p>
    </div>
  )
}

function Large ({ text }: { text: string }): JSX.Element {
  return (
    <div style={{ width: '950px' }}>
      <p className='font-bold'>{text}</p>
      <p>{Date.now()}</p>
      <p>950px</p>
    </div>
  )
}
function Navigate ({ handleContent, component, text }: { handleContent: (c: any, t: string) => void, component: any, text: string }): JSX.Element {
  return <p
    className='px-1'
    onClick={() => { handleContent(component, text) }} >
    {text}
  </p>
}

const initialContent = [<ContentWrapper><Content text='Init' /></ContentWrapper>]
function App (): JSX.Element {
  const widthRef = useRef<HTMLDivElement>(null)
  const [content, setContent] = useState(initialContent)
  const handleContent = (Component: any, text: string): void => {
    setContent((prev) => [
      ...prev,
      <ContentWrapper>
        <Component text={text} />
      </ContentWrapper>
    ])
    history.pushState({ id: uuid() }, '', text)
  }

  function subscribe (callback) {
    window.addEventListener('popstate', callback)
    return () => {
      window.removeEventListener('popstate', callback)
    }
  }

  function getSnapshot () {
    return history.state
  }
  const histState = useSyncExternalStore(subscribe, getSnapshot)
  console.log(histState)

  useLayoutEffect(() => {
    if ((document.documentElement.scrollWidth || 0) > window.innerWidth) {
      console.log('outside of screen')
      setContent((prev) => prev.slice(1))
    }
    console.log(history.state)
  }, [content])

  return (
    <div className='h-screen' ref={widthRef}>
      <div className="flex flex-row w-screen justify-between px-2">
        <nav className='flex flex-row'>
          <Navigate handleContent={handleContent} component={Planning} text='Planning' />
          <Navigate handleContent={handleContent} component={Content} text='Other' />
          <Navigate handleContent={handleContent} component={Small} text='Small' />
          <Navigate handleContent={handleContent} component={Medium} text='Medium' />
          <Navigate handleContent={handleContent} component={Large} text='Large' />
        </nav>
        <p>VW: {window.innerWidth} Doc: {widthRef.current?.scrollWidth}</p>

      </div>
      <div className="flex flex-column gap-4 bg-gray-500 p-2 h-full">
        {content}
      </div>
    </div>
  )
}

export default App

/*
 <div classNameName="bg-gray-500 flex flex-row h-screen">
  <div classNameName="flex h-32 bg-gray-200">1</div>
  <div classNameName="flex-1 w-2/3 mx-auto p-4 text-lg bg-white h-full shadow-lg bg-gray-300">2</div>
</div>
 */
