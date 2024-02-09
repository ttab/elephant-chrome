import { useNavigation } from '@/hooks'

export const AppContent = (): JSX.Element => {
  const { state } = useNavigation()

  return (
    <>
      {state.content}
    </>
  )
}
