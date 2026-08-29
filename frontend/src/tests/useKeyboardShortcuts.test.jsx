import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'

function Harness(props) {
  useKeyboardShortcuts(props)
  return <input aria-label="Title" />
}

describe('useKeyboardShortcuts', () => {
  it('fires registered shortcuts outside editable fields', () => {
    const onNewNote = vi.fn()
    const onSave = vi.fn()
    const onEscape = vi.fn()

    render(<Harness onNewNote={onNewNote} onSave={onSave} onEscape={onEscape} />)

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', ctrlKey: true }))
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true }))
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

    expect(onNewNote).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onEscape).toHaveBeenCalledTimes(1)
  })

  it('does not fire shortcuts from inputs', () => {
    const onNewNote = vi.fn()
    const { getByLabelText } = render(<Harness onNewNote={onNewNote} />)
    const input = getByLabelText('Title')

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', ctrlKey: true, bubbles: true }))

    expect(onNewNote).not.toHaveBeenCalled()
  })
})
