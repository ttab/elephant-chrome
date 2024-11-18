// TODO: We should remove isEditableTarget when no one uses it as it is built into useNavigationKeys
export function isEditableTarget(event: KeyboardEvent): boolean {
  const target = event?.target as HTMLElement


  return !target
    || target.isContentEditable
    || target.nodeName === 'INPUT'
    || target.nodeName === 'TEXTAREA'
    || target.nodeName === 'SELECT'
    || target.nodeName === 'OPTION'
}
