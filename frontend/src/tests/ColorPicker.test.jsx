import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ColorPicker from '../components/ColorPicker'

describe('ColorPicker', () => {
  it('calls onChange when a color is selected', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<ColorPicker value="default" onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: /set yellow color/i }))

    expect(onChange).toHaveBeenCalledWith('yellow')
  })
})
