import {
  Button,
  Dialog, DialogContent, DialogFooter, DialogTrigger
} from '@ttab/elephant-ui'
import * as Y from 'yjs'

import { Planning } from '@/views/Planning'
import { PlusIcon } from '@ttab/elephant-ui/icons'
import { useState } from 'react'
import { newsDocToYMap } from '../../../../src-srv/utils/transformations/yjs/yMap'

export const CreatePlan = (): JSX.Element => {
  const [planning, setPlanning] = useState<[string | undefined, Y.Doc | undefined]>([undefined, undefined])

  return (
    <Dialog open={!!planning[0]}>
      <DialogTrigger asChild>
        <Button variant='ghost' className='h-9 w-9 p-0' onClick={() => {
          setPlanning(createPlanningDocument())
        }}>
          <PlusIcon size={18} strokeWidth={1.75} />
        </Button>
      </DialogTrigger>

      <DialogContent className='p-0 rounded-md'>
        {planning !== null &&
          <Planning
            id={planning[0]}
            document={planning[1]}
            className='p-0 rounded-md'
            asDialog
            onDialogClose={(id) => {
              setPlanning([undefined, undefined])
              if (id) {
                // Open in new view
              }
            }}
          />
        }

        <DialogFooter className='p-4 border-t'>
          <Button onClick={() => {
            // Get the id, post it, and open it in a view?
            setPlanning([undefined, undefined])
          }}>
            Skapa planering
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Create empty planning document and convert it to Y.Doc as appropriate. Returns
 * array with uuid and Y.Doc.
 *
 * @returns [string, Y.Doc]
 */
const createPlanningDocument = (): [string, Y.Doc] => {
  const documentId = crypto.randomUUID()
  const yDoc = new Y.Doc()
  const yEle = yDoc.getMap('ele')

  newsDocToYMap({
    uuid: documentId,
    type: 'core/planning-item',
    uri: `core://newscoverage/${documentId}`,
    url: '',
    title: '',
    content: [],
    meta: [
      {
        id: '',
        uuid: '',
        uri: '',
        url: '',
        type: 'core/planning-item',
        title: '',
        data: {
          public: 'true',
          end_date: '',
          tentative: 'false',
          start_date: ''
        },
        rel: '',
        role: '',
        name: '',
        value: '',
        contentType: '',
        links: [],
        content: [],
        meta: []
      },
      {
        id: '',
        uuid: '',
        uri: '',
        url: '',
        type: 'core/description',
        title: '',
        data: { text: '' },
        rel: '',
        role: 'public',
        name: '',
        value: '',
        contentType: '',
        links: [],
        content: [],
        meta: []
      },
      {
        id: '',
        uuid: '',
        uri: '',
        url: '',
        type: 'core/description',
        title: '',
        data: { text: '' },
        rel: '',
        role: 'internal',
        name: '',
        value: '',
        contentType: '',
        links: [],
        content: [],
        meta: []
      }
    ],
    links: [],
    language: 'sv-se'
  }, yEle)

  return [documentId, yDoc]
}
