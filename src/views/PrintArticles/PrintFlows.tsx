import { useState, type JSX } from 'react'
import { useDocuments } from '@/hooks/index/useDocuments'
import { useRegistry } from '@/hooks/useRegistry'
import type { PrintFlow, PrintFlowFields } from '@/shared/schemas/printFlow'
import { Button, Select, SelectContent, SelectItem, SelectTrigger } from '@ttab/elephant-ui'
import { fields } from '@/shared/schemas/printFlow'
import { toast } from 'sonner'
import { ViewHeader } from '@/components/View/ViewHeader'
import { View } from '@/components/View'
import type { ViewProps } from '@/types/index'
import { TagIcon } from '@ttab/elephant-ui/icons'
import { Form } from '@/components/Form'
import { LoadingText } from '@/components/LoadingText'
import { parseDate } from '@/shared/datetime'
import { useSession } from 'next-auth/react'
import { useQuery } from '@/hooks/useQuery'
import { format } from 'date-fns'
import { useLink } from '@/hooks/useLink'
import { useTranslation } from 'react-i18next'
import { documentTypeValueFormat } from '@/defaults/documentTypeFormats'

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
  const { t } = useTranslation('print')
  const { data, error } = useDocuments<PrintFlow, PrintFlowFields>({
    documentType: 'tt/print-flow',
    fields
  })

  if (error) {
    toast.error(t('flow.errors.fetchFlows'))
    console.error('Could not fetch PrintFlows:', error)
  }
  const openPrintArticle = useLink('PrintEditor')
  const [articleName, setArticleName] = useState<string>()
  const [filter] = useQuery(['from'])
  const [printFlow, setPrintFlow] = useState<string>()
  const { baboon } = useRegistry()
  const { data: session } = useSession()
  const icon = documentTypeValueFormat['tt/print-article'].icon
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
      toast.error(t('flow.errors.noToken'))
      return
    }

    if (!baboon || isSubmitDisabled) {
      toast.error(t('flow.errors.createArticle'))
      return
    }

    try {
      const response = await baboon.createFlow({
        flowUuid: printFlow,
        date: format(new Date(date), 'yyyy-MM-dd'),
        articles: [articleName || ''],
        templateUuid: ''
      }, session.accessToken)

      if (response?.status.code === 'OK') {
        openPrintArticle(undefined, { id: response?.response?.articles?.[0]?.uuid }, 'self')
        toast.success(t('flow.success.articleCreated'))

        if (onDialogClose) {
          onDialogClose()
        }
      }
    } catch (ex) {
      console.error('Error creating print article:', ex)
      toast.error(t('flow.errors.createArticle'))
    }
  }
  const handleCreateFlow = async () => {
    if (!session?.accessToken) {
      toast.error(t('flow.errors.noToken'))
      return
    }

    if (!baboon || isSubmitDisabled) {
      toast.error(t('flow.errors.createFlow'))
      return
    }

    try {
      const response = await baboon.createFlow({
        flowUuid: printFlow,
        date: format(new Date(date), 'yyyy-MM-dd'),
        articles: [],
        templateUuid: ''
      }, session.accessToken)

      if (response?.status.code === 'OK') {
        toast.success(t('flow.success.articleCreated'))

        if (onDialogClose) {
          onDialogClose()
        }
      }
    } catch (ex) {
      console.error('Error creating print flow:', ex)
      toast.error(ex instanceof Error ? ex.message : t('flow.errors.createFlow'))
    }
  }
  return (
    <View.Root asDialog={asDialog} className={className}>
      <ViewHeader.Root>
        <ViewHeader.Content>
          {asDialog && (
            <div className='flex w-full h-full items-center space-x-2 font-bold'>
              <ViewHeader.Title
                name='printheader'
                title={action === 'createArticle' ? t('flow.title.createArticle') : t('flow.title.createFlow')}
                icon={icon}
                iconColor='#006bb3'
                asDialog={asDialog}
              />
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
                  <Form.Group icon={TagIcon}>
                    <Select
                      value={selectedPrintFlow?.value}
                      onValueChange={(option) => {
                        setPrintFlow(option)
                      }}
                    >
                      <SelectTrigger>
                        {selectedPrintFlow?.label || t('flow.placeholder.selectFlow')}
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
                    <Form.Group icon={TagIcon}>
                      <Select
                        disabled={!printFlow}
                        value={articleName}
                        onValueChange={(option) => {
                          setArticleName(option)
                        }}
                      >
                        <SelectTrigger>
                          {articleName || t('flow.placeholder.selectName')}
                        </SelectTrigger>
                        <SelectContent className='max-h-[300px] overflow-y-auto'>
                          {allArticleNames.map((type) => (
                            <SelectItem value={type} key={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Form.Group>
                  )}
                </Form.Content>
                <p className='text-sm text-gray-500'>
                  {action === 'createArticle'
                    ? t('flow.description.newArticleInFlow')
                    : t('flow.description.populateFlow')}
                </p>
                <Form.Footer>
                  <Form.Submit
                    onSubmit={() => {
                      if (!session?.accessToken) {
                        console.error('No access token found')
                        toast.error(t('flow.errors.noToken'))
                        return
                      }

                      if (isSubmitDisabled) {
                        console.error('Missing required fields')
                        toast.error(t('flow.errors.createArticle'))
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
                      <Button variant='secondary' type='reset'>{t('flow.actions.cancel')}</Button>
                      <Button type='submit' disabled={isSubmitDisabled}>{action === 'createArticle' ? t('flow.actions.createArticle') : t('flow.actions.createFlow')}</Button>
                    </div>
                  </Form.Submit>
                </Form.Footer>
              </Form.Root>
            )
          : <LoadingText>{t('flow.loading')}</LoadingText>}
      </View.Content>
    </View.Root>
  )
}
