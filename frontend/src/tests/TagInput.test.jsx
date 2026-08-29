import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import TagInput from '../components/TagInput'

describe('TagInput', () => {
  it('adds a tag when Enter is pressed', async () => {
    const user = userEvent.setup()
    const onAddTag = vi.fn()

    render(<TagInput tags={[]} onAddTag={onAddTag} onRemoveTag={vi.fn()} />)

    await user.type(screen.getByPlaceholderText(/add tag/i), 'research{Enter}')

    expect(onAddTag).toHaveBeenCalledWith('research')
  })

  it('removes an existing tag', async () => {
    const user = userEvent.setup()
    const tag = { id: 1, name: 'work' }
    const onRemoveTag = vi.fn()

    render(<TagInput tags={[tag]} onAddTag={vi.fn()} onRemoveTag={onRemoveTag} />)

    await user.click(screen.getByRole('button', { name: /remove work tag/i }))

    expect(onRemoveTag).toHaveBeenCalledWith(tag)
  })
})
