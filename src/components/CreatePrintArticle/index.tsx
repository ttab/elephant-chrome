import { CalendarIcon, LibraryIcon, TagIcon } from '@ttab/elephant-ui/icons'
import { Form } from '../Form'
import { View, ViewHeader } from '../View'
import type { ViewProps } from '@/types/index'
import { useRegistry } from '@/hooks/useRegistry'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ttab/elephant-ui'
import { useState } from 'react'
import { LoadingText } from '../LoadingText'
import { useTranslation } from 'react-i18next'
import { DatePicker } from '../Datepicker'
import { parseDate } from '@/shared/datetime'
import { useDocuments } from '@/hooks/index/useDocuments'
import { fields } from '@/shared/schemas/printFlow'
import type { PrintFlow, PrintFlowFields } from '@/shared/schemas/printFlow'
import { addDays } from 'date-fns'
import { ToastAction } from '@/components/ToastAction'


export const CreatePrintArticle = ({ id, asDialog, onDialogClose, className }: ViewProps) => {
  const { t } = useTranslation('print')
  const initDate = addDays(new Date(), 1)
  const [printFlow, setPrintFlow] = useState<string>()
  const [articleName, setArticleName] = useState<string>()
  const [dateString, setDateString] = useState<string>(initDate.toISOString().split('T')[0])
  const { baboon } = useRegistry()
  const { data: session } = useSession()

  const { data, error } = useDocuments<PrintFlow, PrintFlowFields>({
    documentType: 'tt/print-flow',
    fields
  })

  if (error) {
    console.error('Could not fetch PrintFlows:', error)
    toast.error(t('create.errors.fetchFlows'))
  }

  const date = parseDate(dateString) || initDate

  const allPrintFlows = data?.map((hit) => ({
    value: hit.id,
    label: hit.fields['document.title'].values[0]
  })) || []

  const allArticleNames = data
    ?.find((hit) => hit.id === printFlow)
    ?.fields['document.content.tt_print_content.name'].values || []

  const selectedPrintFlow = allPrintFlows?.find((flow) => flow.value === printFlow)

  const isSubmitDisabled = !printFlow || !articleName || !id

  const handleCreatePrintArticle = async () => {
    if (!session?.accessToken) {
      toast.error(t('create.errors.noToken'))
      return
    }

    if (!baboon || isSubmitDisabled) {
      toast.error(t('create.errors.createArticle'))
      return
    }

    try {
      const response = await baboon.createPrintArticle({
        sourceUuid: id,
        sourceVersion: 0n,
        flowUuid: printFlow,
        date: dateString,
        article: articleName
      }, session.accessToken)

      if (response?.status.code === 'OK') {
        toast.success(t('create.success.created'), {
          classNames: {
            title: 'whitespace-nowrap'
          },
          action: (
            <ToastAction
              documentId={response.response.uuid}
              withView='PrintEditor'
              label={t('create.actions.open')}
              Icon={LibraryIcon}
            />
          )
        })

        if (onDialogClose) {
          onDialogClose()
        }
      }
    } catch (ex) {
      console.error('Error creating print article:', ex)
      toast.error(t('create.errors.createArticle'))
    }
  }

  return (
    <View.Root asDialog={asDialog} className={className}>
      <ViewHeader.Root>
        <ViewHeader.Content>
          {asDialog && (
            <div className='flex w-full h-full items-center space-x-2 font-bold'>
              <ViewHeader.Title
                name='Assignment'
                title={t('create.title')}
                icon={LibraryIcon}
                iconColor='#006bb3'
                asDialog={asDialog}
              />
            </div>
          )}
        </ViewHeader.Content>

        <ViewHeader.Action onDialogClose={onDialogClose} />
      </ViewHeader.Root>

      <View.Content>
        {data?.length
          ? (
              <Form.Root asDialog={asDialog}>
                <Form.Content>
                  <Form.Group icon={TagIcon}>
                    <Select
                      value={selectedPrintFlow?.value || ''}
                      onValueChange={(option) => {
                        setPrintFlow(option)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('create.placeholder.selectFlow')}>{selectedPrintFlow?.label}</SelectValue>
                      </SelectTrigger>
                      <SelectContent
                        style={{
                          width: 'var(--radix-select-trigger-width)',
                          maxHeight: 'var(--radix-select-content-available-height)' }}
                      >
                        {allPrintFlows.map((flow) => (
                          <SelectItem value={flow.value} key={flow.value}>
                            {flow.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Form.Group>
                  <Form.Group icon={TagIcon}>
                    <Select
                      disabled={!printFlow}
                      value={articleName || ''}
                      onValueChange={(option) => {
                        setArticleName(option)
                      }}
                    >
                      <SelectTrigger>

                        <SelectValue placeholder={t('create.placeholder.selectName')}>{articleName}</SelectValue>
                      </SelectTrigger>
                      <SelectContent
                        style={{
                          width: 'var(--radix-select-trigger-width)',
                          maxHeight: 'var(--radix-select-content-available-height)' }}
                      >

                        {allArticleNames.map((type) => (
                          <SelectItem value={type} key={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Form.Group>
                  <Form.Group icon={CalendarIcon}>
                    <DatePicker date={date} setDate={(newDate) => setDateString(newDate)} disabled={!printFlow} />
                  </Form.Group>
                </Form.Content>

                <Form.Footer>
                  <Form.Submit
                    onSubmit={() => {
                      if (!session?.accessToken) {
                        console.error('No access token found')
                        toast.error(t('create.errors.noToken'))
                        return
                      }

                      if (isSubmitDisabled) {
                        console.error('Missing required fields')
                        toast.error(t('create.errors.createArticle'))
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
                      <Button variant='secondary' type='reset'>{t('create.actions.cancel')}</Button>
                      <Button type='submit' disabled={isSubmitDisabled}>{t('create.actions.create')}</Button>
                    </div>
                  </Form.Submit>
                </Form.Footer>
              </Form.Root>
            )
          : <LoadingText>{t('create.loading')}</LoadingText>}
      </View.Content>
    </View.Root>
  )
}
