import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ttab/elephant-ui'

export const PromptCauseField = ({ onValueChange }: {
  onValueChange: (value: string) => void
}) => {
  return (
    <>
      <Label htmlFor='StatusCause'>Anledning</Label>
      <Select onValueChange={onValueChange} name='StatusCause'>
        <SelectTrigger>
          <SelectValue placeholder='Välj anledning...' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='UV'>UV</SelectItem>
          <SelectItem value='KORR'>KORR</SelectItem>
          <SelectItem value='RÄ'>RÄ</SelectItem>
          <SelectItem value='OMS'>OMS</SelectItem>
        </SelectContent>
      </Select>
    </>
  )
}
