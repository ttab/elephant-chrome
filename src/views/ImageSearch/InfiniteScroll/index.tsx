import React, { type Ref, type ReactNode, useEffect, useState } from 'react'
import type { SWRInfiniteResponse } from 'swr/infinite'

interface Props<T> {
  swr: SWRInfiniteResponse<T>
  children: ReactNode | ((item: T) => ReactNode)
  loadingIndicator?: ReactNode
  endingIndicator?: ReactNode
  isReachingEnd: boolean | ((swr: SWRInfiniteResponse<T>) => boolean)
  offset?: number
}


const useIntersection = <T extends HTMLElement>(): [boolean, Ref<T>] => {
  const [intersecting, setIntersecting] = useState<boolean>(false)
  const [element, setElement] = useState<HTMLElement>()
  useEffect(() => {
    if (!element) return
    const observer = new IntersectionObserver((entries) => {
      setIntersecting(entries[0]?.isIntersecting)
    })
    observer.observe(element)
    return () => observer.unobserve(element)
  }, [element])
  return [
    intersecting,
    (el) => {
      if (el) {
        setElement(el)
      }
    }
  ]
}

const InfiniteScroll = <T,>(props: Props<T>): React.ReactElement<Props<T>> => {
  const {
    swr,
    swr: { setSize, data, isValidating },
    children,
    loadingIndicator,
    endingIndicator,
    isReachingEnd,
    offset = 0
  } = props

  const [intersecting, ref] = useIntersection<HTMLDivElement>()

  const ending = typeof isReachingEnd === 'function' ? isReachingEnd(swr) : isReachingEnd

  useEffect(() => {
    if (intersecting && !isValidating && !ending) {
      void setSize((size) => size + 1)
    }
  }, [intersecting, isValidating, setSize, ending])

  return (
    <>
      {typeof children === 'function'
        ? data?.map((item): ReactNode => children(item))
        : children}
      <div className='flex relative bg-gray-200 min-h-[144px] place-content-center place-items-center'>
        <div ref={ref} className={`absolute top-[${offset}]`}></div>
        {(swr.isLoading || swr.isValidating) && loadingIndicator}
        {ending && endingIndicator}
      </div>
    </>
  )
}

export default InfiniteScroll
