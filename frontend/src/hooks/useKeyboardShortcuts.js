import { useEffect } from 'react'

function isEditableTarget(target) {
  const tagName = target?.tagName?.toLowerCase()
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    target?.isContentEditable ||
    Boolean(target?.closest?.('.ProseMirror'))
  )
}

export function useKeyboardShortcuts({ onNewNote, onSave, onEscape } = {}) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (isEditableTarget(event.target)) return

      const key = event.key.toLowerCase()
      const hasModifier = event.ctrlKey || event.metaKey

      if (hasModifier && key === 'n') {
        event.preventDefault()
        onNewNote?.()
      }

      if (hasModifier && key === 's') {
        event.preventDefault()
        onSave?.()
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        onEscape?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onEscape, onNewNote, onSave])
}

export { isEditableTarget }
