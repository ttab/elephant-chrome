import { useState } from 'react'
import { useDocuments } from '@/hooks/index/useDocuments'
import { useRegistry } from '@/hooks/useRegistry'
import type { PrintFlow, PrintFlowFields } from '@/hooks/index/useDocuments/schemas/printFlow'
import { Button, Select, SelectContent, SelectItem, SelectTrigger } from '@ttab/elephant-ui'
import { fields } from '@/hooks/index/useDocuments/schemas/printFlow'
import { toast } from 'sonner'
import { ViewHeader } from '@/components/View/ViewHeader'
import { View } from '@/components/View'
import type { ViewProps } from '@/types/index'
import { Library, Tag, Calendar } from '@ttab/elephant-ui/icons'
import { Form } from '@/components/Form'
import { DatePicker } from '@/components/Datepicker'
import { LoadingText } from '@/components/LoadingText'
import { parseDate } from '@/lib/datetime'
import { useSession } from 'next-auth/react'
import { useQuery } from '@/hooks/useQuery'
import { format } from 'date-fns'

/**
 * PrintFlows component.
 *
 * This component fetches and displays a list of print flows. It uses the `useDocuments` hook
 * to retrieve the data from the server and displays each flow with its title and content names.
 * A button is provided for each flow, but its functionality is not yet implemented.
 *
 * @returns The rendered PrintFlows component.
 *
 * @remarks
 * The component handles errors by logging them to the console. It requires a valid session
 * and registry to fetch the print flows data.
 */

const fallbackDate = new Date()

export const PrintFlows = ({ asDialog, onDialogClose, className, action }: ViewProps & { action: 'createArticle' | 'createFlow' }): JSX.Element => {
  const { data, error } = useDocuments<PrintFlow, PrintFlowFields>({
    documentType: 'tt/print-flow',
    fields
  })

  if (error) {
    toast.error('Kunde inte hämta printflöden')
    console.error('Could not fetch PrintFlows:', error)
  }
  const [articleName, setArticleName] = useState<string>()
  const [filter] = useQuery(['from'])
  const [printFlow, setPrintFlow] = useState<string>()
  const [, setDateString] = useState<string>()
  const { baboon } = useRegistry()
  const { data: session } = useSession()
  const date = !filter?.from ? fallbackDate : parseDate(filter?.from?.[0] || '')
  const allPrintFlows = data?.map((hit) => ({
    value: hit.id,
    label: hit.fields['document.title'].values[0]
  })) || []

  const allArticleNames = data
    ?.find((hit) => hit.id === printFlow)
    ?.fields['document.content.tt_print_content.name'].values || []


  const selectedPrintFlow = allPrintFlows?.find((flow) => flow.value === printFlow)

  const isSubmitDisabled = !printFlow || !date

  const handleCreateArticle = async () => {
    if (!session?.accessToken) {
      toast.error('Ingen access token hittades')
      return
    }

    if (!baboon || isSubmitDisabled) {
      toast.error('Något gick fel när printartikel skulle skapas')
      return
    }

    try {
      const response = await baboon.createFlow({
        flowUuid: printFlow,
        date: format(new Date(date), 'yyyy-MM-dd'),
        articles: [articleName || '']
      }, session.accessToken)

      if (response?.status.code === 'OK') {
        toast.success('Printartikel skapad')

        if (onDialogClose) {
          onDialogClose()
        }
      }
    } catch (ex) {
      console.error('Error creating print article:', ex)
      toast.error('Något gick fel när printartikel skulle skapas')
    }
  }
  const handleCreateFlow = async () => {
    if (!session?.accessToken) {
      toast.error('Ingen access token hittades')
      return
    }

    if (!baboon || isSubmitDisabled) {
      toast.error('Något gick fel när printflöde skulle skapas')
      return
    }

    try {
      const response = await baboon.createFlow({
        flowUuid: printFlow,
        date: format(new Date(date), 'yyyy-MM-dd'),
        articles: []
      }, session.accessToken)

      if (response?.status.code === 'OK') {
        toast.success('Printartikel skapad')

        if (onDialogClose) {
          onDialogClose()
        }
      }
    } catch (ex) {
      console.error('Error creating print flow:', ex)
      toast.error('Något gick fel när printflöde skulle skapas')
    }
  }
  return (
    <View.Root asDialog={asDialog} className={className}>
      <ViewHeader.Root>
        <ViewHeader.Content>
          {asDialog && (
            <div className='flex w-full h-full items-center space-x-2 font-bold'>
              <ViewHeader.Title name='printheader' title={action === 'createArticle' ? 'Skapa printartikel' : 'Skapa printflöde'} icon={Library} iconColor='#006bb3' />
            </div>
          )}
        </ViewHeader.Content>
        <ViewHeader.Action onDialogClose={onDialogClose} asDialog={asDialog}>
        </ViewHeader.Action>
      </ViewHeader.Root>
      <View.Content className='p-4'>
        {data?.length
          ? (
              <Form.Root asDialog={asDialog}>
                <Form.Content>
                  <Form.Group icon={Tag}>
                    <Select
                      value={selectedPrintFlow?.value}
                      onValueChange={(option) => {
                        setPrintFlow(option)
                      }}
                    >
                      <SelectTrigger>
                        {selectedPrintFlow?.label || 'Välj printflöde'}
                      </SelectTrigger>
                      <SelectContent>
                        {allPrintFlows.map((flow) => (
                          <SelectItem value={flow.value} key={flow.value}>
                            {flow.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Form.Group>
                  {action === 'createArticle' && (
                    <Form.Group icon={Tag}>
                      <Select
                        disabled={!printFlow}
                        value={articleName}
                        onValueChange={(option) => {
                          setArticleName(option)
                        }}
                      >
                        <SelectTrigger>
                          {articleName || 'Välj namn'}
                        </SelectTrigger>
                        <SelectContent>
                          {allArticleNames.map((type) => (
                            <SelectItem value={type} key={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Form.Group>
                  )}
                  <Form.Group icon={Calendar}>
                    <DatePicker date={date || new Date()} setDate={(newDate) => setDateString(newDate)} disabled={!printFlow} />
                  </Form.Group>
                </Form.Content>
                <p className='text-sm text-gray-500'>
                  {action === 'createArticle'
                    ? 'Ny printartikel i valt flöde'
                    : 'Populera valt flöde med artiklar'}
                </p>
                <Form.Footer>
                  <Form.Submit
                    onSubmit={() => {
                      if (!session?.accessToken) {
                        console.error('No access token found')
                        toast.error('Ingen access token hittades')
                        return
                      }

                      if (isSubmitDisabled) {
                        console.error('Missing required fields')
                        toast.error('Något gick fel när printartikel skulle skapas')
                        return
                      }
                      if (action === 'createArticle') {
                        void handleCreateArticle()
                      } else {
                        void handleCreateFlow()
                      }
                    }}
                    onReset={() => {
                      if (onDialogClose) {
                        onDialogClose()
                      }
                    }}
                  >
                    <div className='flex justify-end gap-4'>
                      <Button variant='secondary' type='reset'>Avbryt</Button>
                      <Button type='submit' disabled={isSubmitDisabled}>{action === 'createArticle' ? 'Skapa printartikel' : 'Skapa printflöde'}</Button>
                    </div>
                  </Form.Submit>
                </Form.Footer>
              </Form.Root>
            )
          : <LoadingText>Laddar printflöden..</LoadingText>}
      </View.Content>
    </View.Root>
  )
}
