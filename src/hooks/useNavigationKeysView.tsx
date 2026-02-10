import { useRef } from 'react'
import { useView } from './useView'
import { useNavigationKeys } from './useNavigationKeys'

type UseViewNavigationKeysProps = {
  keys: Parameters<typeof useNavigationKeys>[0]['keys']
  onNavigation: Parameters<typeof useNavigationKeys>[0]['onNavigation']
  preventDefault?: boolean
  stopPropagation?: boolean
  capture?: boolean
}

export function useViewNavigationKeys({
  keys,
  onNavigation,
  preventDefault = true,
  stopPropagation = true,
  capture = false
}: UseViewNavigationKeysProps) {
  const { isActive } = useView()
  const ref = useRef<HTMLDivElement>(null)

  useNavigationKeys({
    enabled: isActive,
    elementRef: ref,
    keys,
    onNavigation,
    preventDefault,
    stopPropagation,
    capture
  })

  return ref
}
