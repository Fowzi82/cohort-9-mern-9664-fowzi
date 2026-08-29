import { beforeEach, describe, expect, it, vi } from 'vitest'
import { exportNoteAsMarkdown } from '../lib/exportNoteAsMarkdown'

describe('exportNoteAsMarkdown', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:note'),
      revokeObjectURL: vi.fn(),
    })
  })

  it('downloads note text as a markdown file', () => {
    const click = vi.fn()
    const originalCreateElement = document.createElement.bind(document)

    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      const element = originalCreateElement(tagName)
      if (tagName === 'a') {
        element.click = click
      }
      return element
    })

    const result = exportNoteAsMarkdown('Project Plan!', '<p>Hello <strong>team</strong></p>')

    expect(result).toEqual({ filename: 'project-plan.md', markdown: 'Hello team' })
    expect(click).toHaveBeenCalledTimes(1)
  })
})
