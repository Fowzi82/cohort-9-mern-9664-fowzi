import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RegisterPage from '../pages/RegisterPage'
import api from '../lib/axios'

const navigateMock = vi.fn()

vi.mock('../lib/axios', () => ({
  default: {
    post: vi.fn(),
  },
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

function renderRegisterPage() {
  return render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>
  )
}

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders username, email, and password inputs', () => {
    renderRegisterPage()

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('renders Create Account button', () => {
    renderRegisterPage()

    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('shows error on empty submission', async () => {
    api.post.mockRejectedValueOnce({
      response: { data: { error: 'All fields are required.' } },
    })
    const { container } = renderRegisterPage()

    fireEvent.submit(container.querySelector('form'))

    expect(await screen.findByRole('alert')).toHaveTextContent('All fields are required.')
  })
})
