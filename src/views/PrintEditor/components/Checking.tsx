import { SettingsIcon } from '@ttab/elephant-ui/icons'

export const Checking = () => (
  <main className='flex flex-col items-center justify-center mt-8 gap-4'>
    <p className='flex gap-1'>
      <span>Kontrollerar layouter</span>
    </p>
    <section className='flex flex-row items-center justify-center gap-0'>
      <div className='animate-spin'>
        <SettingsIcon className='animate-pulse text-[#006bb3]' strokeWidth={1.75} size={24} />
      </div>
      <div className='animate-spin mt-4'>
        <SettingsIcon className='animate-pulse text-[#006bb3]' strokeWidth={1.75} size={24} />
      </div>
      <div className='animate-spin'>
        <SettingsIcon className='animate-pulse text-[#006bb3]' strokeWidth={1.75} size={24} />
      </div>
    </section>
  </main>
)
