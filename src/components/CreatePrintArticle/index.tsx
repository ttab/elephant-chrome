import { Calendar, Library, Tag } from '@ttab/elephant-ui/icons'
import { Form } from '../Form'
import { View, ViewHeader } from '../View'
import type { ViewProps } from '@/types/index'
import { useRegistry } from '@/hooks/useRegistry'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { Button, Select, SelectContent, SelectItem, SelectTrigger } from '@ttab/elephant-ui'
import { useState } from 'react'
import { LoadingText } from '../LoadingText'
import { DatePicker } from '../Datepicker'
import { parseDate } from '@/lib/datetime'
import { useFetchPrintFlows } from './hooks/useFetchPrintFlows'

const fallbackDate = new Date()

export const CreatePrintArticle = ({ id, asDialog, onDialogClose, className }: ViewProps) => {
  const [printFlow, setPrintFlow] = useState<string>()
  const [articleName, setArticleName] = useState<string>()
  const [dateString, setDateString] = useState<string>()
  const { server: { indexUrl }, baboon } = useRegistry()
  const { data: session } = useSession()

  const { data, error } = useFetchPrintFlows(indexUrl, session)

  if (error) {
    console.error('Could not fetch PrintFlows:', error)
    toast.error('Något gick fel när flöden skulle hämtas')
  }

  const date = dateString ? parseDate(dateString) || fallbackDate : fallbackDate

  const allPrintFlows = data?.hits.map((hit) => ({
    value: hit.id,
    label: hit.fields['document.title'].values[0]
  })) || []

  const allArticleNames = data?.hits
    .find((hit) => hit.id === printFlow)
    ?.fields['document.content.tt_print_content.name'].values || []

  const selectedPrintFlow = allPrintFlows?.find((flow) => flow.value === printFlow)

  const isSubmitDisabled = !printFlow || !articleName || !dateString || !id

  const handleCreatePrintArticle = async () => {
    if (!session?.accessToken) {
      toast.error('Ingen access token hittades')
      return
    }

    if (!baboon || isSubmitDisabled) {
      toast.error('Något gick fel när printartikel skulle skapas')
      return
    }

    try {
      const response = await baboon.createPrintArticle({
        sourceUuid: id,
        flowUuid: printFlow,
        date: dateString,
        article: articleName
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

  return (
    <View.Root asDialog={asDialog} className={className}>
      <ViewHeader.Root>
        <ViewHeader.Content>
          {asDialog && (
            <div className='flex w-full h-full items-center space-x-2 font-bold'>
              <ViewHeader.Title name='Assignment' title='Skapa printartikel' icon={Library} iconColor='#006bb3' />
            </div>
          )}
        </ViewHeader.Content>

        <ViewHeader.Action onDialogClose={onDialogClose}>
          {!asDialog && !!id
          && <ViewHeader.RemoteUsers documentId={id} />}
        </ViewHeader.Action>
      </ViewHeader.Root>

      <View.Content>
        {data?.hits.length
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
                  <Form.Group icon={Calendar}>
                    <DatePicker date={date} setDate={(newDate) => setDateString(newDate)} disabled={!printFlow} />
                  </Form.Group>
                </Form.Content>

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

                      void handleCreatePrintArticle()
                    }}
                    onReset={() => {
                      if (onDialogClose) {
                        onDialogClose()
                      }
                    }}
                  >
                    <div className='flex justify-end gap-4'>
                      <Button variant='secondary' type='reset'>Avbryt</Button>
                      <Button type='submit' disabled={isSubmitDisabled}>Skapa printartikel</Button>
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
