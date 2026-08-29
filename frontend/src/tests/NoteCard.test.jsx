import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import NoteCard from '../components/NoteCard'

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
  },
}))

const note = {
  id: 'note-1',
  title: 'Pinned idea',
  content: '<p>Hello</p>',
  is_pinned: false,
  color: 'default',
  tags: [{ id: 1, name: 'work' }],
}

function renderCard(overrides = {}) {
  const props = {
    note: { ...note, ...overrides },
    previewText: 'Hello',
    wordCount: 1,
    updatedLabel: 'today',
    onOpen: vi.fn(),
    onPin: vi.fn(),
    onColor: vi.fn(),
    onArchive: vi.fn(),
    onDelete: vi.fn(),
  }

  render(<NoteCard {...props} />)
  return props
}

describe('NoteCard', () => {
  it('calls onPin when the pin button is clicked', async () => {
    const user = userEvent.setup()
    const props = renderCard()

    await user.click(screen.getByRole('button', { name: /pin pinned idea/i }))

    expect(props.onPin).toHaveBeenCalledWith(props.note)
  })

  it('calls onColor when a color is selected', async () => {
    const user = userEvent.setup()
    const props = renderCard()

    await user.click(screen.getByRole('button', { name: /set blue color/i }))

    expect(props.onColor).toHaveBeenCalledWith(props.note, 'blue')
  })
})
