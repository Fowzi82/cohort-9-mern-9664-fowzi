import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import DashboardPage from '../pages/DashboardPage'
import api from '../lib/axios'

const logoutMock = vi.fn()
const navigateMock = vi.fn()
const socketMock = {
  on: vi.fn(),
  off: vi.fn(),
}

vi.mock('../lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('../lib/socket', () => ({
  initSocket: vi.fn(() => socketMock),
  getSocket: vi.fn(() => socketMock),
  closeSocket: vi.fn(),
}))

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => socketMock),
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', username: 'Fowzi', email: 'fowzi@example.com' },
    logout: logoutMock,
    isAuthenticated: true,
  }),
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

vi.mock('../pages/NoteEditorModal', () => ({
  default: ({ onClose, onSaved }) => (
    <button
      type="button"
      onClick={() => {
        onSaved({
          closeAfterSave: true,
          isNewNote: true,
          note: {
            id: 'note-1',
            title: 'First note',
            content: '<p>Hello dashboard</p>',
          },
        })
        onClose()
      }}
    >
      Mock save note
    </button>
  ),
}))

function renderDashboardPage() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>
  )
}

describe('DashboardPage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('renders New Note button', async () => {
    api.get.mockResolvedValueOnce({ data: [] })

    renderDashboardPage()

    expect(await screen.findByRole('button', { name: /new note/i })).toBeInTheDocument()
  })

  it('renders search input', async () => {
    api.get.mockResolvedValueOnce({ data: [] })

    renderDashboardPage()

    expect(await screen.findByPlaceholderText(/search notes/i)).toBeInTheDocument()
  })

  it('shows empty state when no notes', async () => {
    api.get.mockResolvedValueOnce({ data: [] })

    renderDashboardPage()

    expect(await screen.findByText(/your blank page is waiting/i)).toBeInTheDocument()
  })

  it('shows notes when API returns data', async () => {
    api.get.mockResolvedValueOnce({
      data: [
        {
          id: 'note-1',
          title: 'Sprint planning',
          content: '<p>Ship focused improvements this week.</p>',
          updatedAt: '2026-08-30T08:00:00.000Z',
        },
        {
          id: 'note-2',
          title: 'Reading list',
          content: '<p>Review product notes.</p>',
          updatedAt: '2026-08-29T08:00:00.000Z',
        },
      ],
    })

    renderDashboardPage()

    await waitFor(() => {
      expect(screen.getByText('Sprint planning')).toBeInTheDocument()
      expect(screen.getByText('Reading list')).toBeInTheDocument()
    })
  })

  it('shows the first newly created note without reloading or re-fetching', async () => {
    const user = userEvent.setup()
    api.get.mockResolvedValueOnce({ data: [] })

    renderDashboardPage()

    expect(await screen.findByText(/your blank page is waiting/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /new note/i }))
    await user.click(screen.getByRole('button', { name: /mock save note/i }))

    expect(await screen.findByText('First note')).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledTimes(1)
  })
})
