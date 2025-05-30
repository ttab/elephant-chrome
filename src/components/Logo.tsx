import React from 'react'
import { cn } from '@ttab/elephant-ui/utils'

export const Logo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div>
      <svg className={cn(className)} xmlns='http://www.w3.org/2000/svg' version='1.1' viewBox='0 0 787.37 157.54'>
        <defs>
          <style>
            {`
              .cls-1 {
                fill: #5c6f9e;
              }
            `}
          </style>
        </defs>
        <g>
          <g id='Lager_1'>
            <g id='Lager_1-2' data-name='Lager_1'>
              <g id='Lager_1-2'>
                <g id='Lager_1-2-2' data-name='Lager_1-2'>
                  <g>
                    <g>
                      <path className='cls-1' d='M61.56,125.09c-6.1-11.2-38.01-12.39-42.45,1.36-.27.85-.45,1.93-.56,3.17,10.91,12.92,25.89,22.27,42.96,26.08.26-9.8,4.22-22.95.04-30.61h0Z' />
                      <path className='cls-1' d='M78.76,0C43.38,0,13.46,23.32,3.5,55.43c14.32-10.95,28.84-9.41,46.34-9.31-8.87,17.21-4.21,36.56,12.56,46.53,16.87,10.04,31.1,3.26,32.09,4.59l-7.58,59.96c39.68-4.08,70.63-37.62,70.63-78.39C157.54,35.28,122.26,0,78.75,0h.01,0ZM140.17,89.26c-1.17.08-5.96-.97-6.28-.51-.36,10.21,2.87,33.57-3.74,41.1-6.42,7.33-20.09,6.29-26.49-1.7-7.6-9.49-.08-6.79,6.28-10.36l.85.17c1.91,6.15,9.56,7.16,11.55,2.04,2.18-5.62-.38-36.58-18.17-33.46-1.81.32-14.55,11.6-34.98,3.06-29.96-12.53-21.08-55.82,13.24-52.31,6.1.62,14.61,4.39,19.02,8.83,34.4,4.56,21.94,28.27,36.33,39.74,2.11,1.68,7.89,3.03,2.38,3.4h0Z' />
                    </g>
                    <g>
                      <path className='cls-1' d='M239.58,118.06V23.23h57.13v14.21h-40.31v24.22h34.08v14.21h-34.08v27.98h41.76v14.21h-58.58,0Z' />
                      <path className='cls-1' d='M332.38,119.52c-3.96,0-7.13-.8-9.5-2.39s-4.08-3.89-5.15-6.89c-1.06-3-1.6-6.57-1.6-10.73V15.7h16.67v84.68c0,2.13.39,3.58,1.16,4.35.77.78,1.64,1.16,2.61,1.16.39,0,.75-.02,1.09-.07s.8-.12,1.38-.22l2.17,12.47c-.97.39-2.2.73-3.7,1.02-1.5.29-3.21.43-5.15.43h.02Z' />
                      <path className='cls-1' d='M386.03,119.81c-6.67,0-12.69-1.47-18.05-4.42s-9.59-7.2-12.69-12.76c-3.09-5.56-4.64-12.3-4.64-20.23s1.6-14.38,4.79-19.94,7.3-9.83,12.33-12.83c5.02-3,10.34-4.5,15.95-4.5,6.48,0,11.89,1.45,16.24,4.35s7.61,6.89,9.79,11.96c2.18,5.08,3.26,10.9,3.26,17.47,0,1.55-.07,3.04-.22,4.5-.14,1.45-.36,2.85-.65,4.2h-49.01v-12.76h35.09c0-5.12-1.16-9.16-3.48-12.11-2.32-2.95-5.9-4.42-10.73-4.42-2.71,0-5.34.73-7.9,2.18s-4.69,3.92-6.38,7.4-2.54,8.31-2.54,14.5c0,5.61.96,10.17,2.9,13.7,1.93,3.53,4.5,6.14,7.69,7.83s6.62,2.54,10.29,2.54c3.09,0,6.02-.44,8.77-1.3,2.75-.87,5.34-2.08,7.76-3.62l5.8,10.73c-3.29,2.32-7.03,4.16-11.24,5.51s-8.58,2.03-13.12,2.03h-.01,0Z' />
                      <path className='cls-1' d='M428.95,146.19V46.87h13.78l1.16,7.54h.58c2.99-2.61,6.33-4.81,10-6.6s7.49-2.68,11.46-2.68c5.9,0,10.92,1.5,15.08,4.5,4.16,3,7.35,7.2,9.57,12.61,2.22,5.42,3.33,11.79,3.33,19.14,0,8.12-1.45,15.03-4.35,20.73-2.9,5.71-6.65,10.08-11.24,13.12s-9.55,4.57-14.86,4.57c-3.09,0-6.19-.68-9.28-2.03-3.1-1.35-6.09-3.29-8.99-5.8l.43,11.89v22.33h-16.67,0ZM459.98,106.03c3.19,0,6.04-.92,8.55-2.75s4.5-4.57,5.95-8.19,2.17-8.14,2.17-13.56c0-4.73-.53-8.79-1.6-12.18-1.06-3.38-2.73-5.97-5-7.76s-5.2-2.68-8.77-2.68c-2.61,0-5.17.65-7.68,1.96-2.52,1.31-5.17,3.31-7.98,6.02v33.21c2.61,2.13,5.15,3.65,7.61,4.57s4.71,1.38,6.74,1.38v-.02s.01,0,.01,0Z' />
                      <path className='cls-1' d='M510.73,118.06V15.69h16.67v26.39l-.58,13.77c2.99-2.8,6.33-5.29,10-7.47s7.93-3.26,12.76-3.26c7.64,0,13.2,2.46,16.68,7.4s5.22,11.89,5.22,20.88v44.66h-16.67v-42.48c0-5.9-.87-10.05-2.61-12.47s-4.59-3.62-8.56-3.62c-3.09,0-5.83.75-8.19,2.25-2.37,1.5-5.05,3.7-8.05,6.6v49.73h-16.67Z' />
                      <path className='cls-1' d='M608.89,119.81c-4.16,0-7.83-.87-11.02-2.61s-5.68-4.18-7.47-7.32-2.68-6.79-2.68-10.95c0-8.02,3.36-14.09,10.08-18.2,6.72-4.11,17.38-6.94,31.97-8.48-.1-2.42-.56-4.64-1.38-6.67s-2.17-3.65-4.06-4.86c-1.88-1.21-4.42-1.81-7.61-1.81-3.48,0-6.89.63-10.22,1.89-3.33,1.26-6.6,2.85-9.79,4.78l-6.09-11.31c2.61-1.64,5.46-3.17,8.55-4.57,3.09-1.4,6.38-2.51,9.86-3.33s7.1-1.23,10.88-1.23c5.9,0,10.8,1.19,14.72,3.55,3.92,2.37,6.86,5.85,8.84,10.44,1.98,4.59,2.97,10.22,2.97,16.89v42.05h-13.77l-1.16-7.83h-.58c-3.29,2.71-6.72,4.98-10.29,6.82-3.58,1.83-7.49,2.75-11.75,2.75ZM614.11,106.18c2.9,0,5.58-.6,8.05-1.81,2.46-1.21,5-3.02,7.61-5.44v-15.08c-6.48.77-11.6,1.79-15.37,3.04-3.77,1.26-6.45,2.78-8.05,4.57-1.59,1.79-2.39,3.89-2.39,6.31,0,3,.96,5.15,2.9,6.45,1.93,1.31,4.35,1.96,7.25,1.96h0Z' />
                      <path className='cls-1' d='M666.46,118.06V46.87h13.78l1.16,9.57h.58c3.19-3.09,6.67-5.75,10.44-7.98,3.77-2.22,8.07-3.33,12.9-3.33,7.64,0,13.2,2.46,16.68,7.4s5.22,11.89,5.22,20.88v44.66h-16.67v-42.48c0-5.9-.87-10.05-2.61-12.47s-4.59-3.62-8.56-3.62c-3.09,0-5.83.75-8.19,2.25-2.37,1.5-5.05,3.7-8.05,6.6v49.73h-16.67v-.02h-.01Z' />
                      <path className='cls-1' d='M772.74,119.52c-8.22,0-14.04-2.39-17.47-7.18s-5.15-11-5.15-18.63v-33.64h-10.15v-12.47l11.02-.72,2.03-22.33h13.92v22.33h18.12v13.19h-18.12v33.64c0,4.16.82,7.27,2.46,9.35s4.16,3.12,7.54,3.12c1.25,0,2.51-.1,3.77-.29s2.46-.58,3.62-1.16l3.04,11.75c-1.84.87-4.01,1.59-6.53,2.17s-5.22.87-8.12.87c0,0,.02,0,.02,0Z' />
                    </g>
                  </g>
                </g>
              </g>
            </g>
          </g>
        </g>
      </svg>
    </div>
  )
}
