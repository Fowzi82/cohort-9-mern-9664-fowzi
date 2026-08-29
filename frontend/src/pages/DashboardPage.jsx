import { motion } from 'framer-motion'
import { Copy, Download, FileText, LogOut, Plus, Search, Sparkles, Trash2, Upload } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'
import { useAuth } from '../context/AuthContext'
import api from '../lib/axios'
import { closeSocket, getSocket, initSocket } from '../lib/socket'
import { getAvatarDisplayName, getInitials, getStoredProfile } from '../lib/profile'
import NoteEditorModal from './NoteEditorModal'

function stripHtml(value) {
  return (value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function countWords(value) {
  const text = stripHtml(value)
  if (!text) return 0
  return text.split(/\s+/).filter(Boolean).length
}

function formatRelativeTime(value) {
  if (!value) return 'just now'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'just now'

  const seconds = Math.round((date.getTime() - Date.now()) / 1000)
  const absSeconds = Math.abs(seconds)
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

  if (absSeconds < 60) return rtf.format(seconds, 'second')
  if (absSeconds < 3600) return rtf.format(Math.round(seconds / 60), 'minute')
  if (absSeconds < 86400) return rtf.format(Math.round(seconds / 3600), 'hour')
  if (absSeconds < 2592000) return rtf.format(Math.round(seconds / 86400), 'day')
  if (absSeconds < 31536000) return rtf.format(Math.round(seconds / 2592000), 'month')
  return rtf.format(Math.round(seconds / 31536000), 'year')
}

function DashboardPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [profile, setProfile] = useState(() => getStoredProfile())
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingNote, setEditingNote] = useState(null)
  const [showEditor, setShowEditor] = useState(false)
  const [query, setQuery] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const searchInputRef = useRef(null)
  const importInputRef = useRef(null)

  const avatarName = useMemo(() => getAvatarDisplayName(user, profile), [profile, user])
  const avatarInitials = useMemo(() => getInitials(avatarName), [avatarName])

  const loadNotes = useCallback(async () => {
    try {
      setError('')
      const response = await api.get('/api/notes')
      setNotes(Array.isArray(response.data) ? response.data : response.data.notes || [])
    } catch (requestError) {
      const message = requestError.response?.data?.error || 'Unable to load your notes.'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  useEffect(() => {
    const socket = initSocket()

    socket.on('note:created', (newNote) => {
      setNotes((currentNotes) => {
        const exists = currentNotes.some((n) => n.id === newNote.id)
        if (exists) return currentNotes
        return [newNote, ...currentNotes]
      })
      toast.success('New note created.')
    })

    socket.on('note:updated', (updatedNote) => {
      setNotes((currentNotes) =>
        currentNotes.map((n) => (n.id === updatedNote.id ? updatedNote : n))
      )
      toast.success('Note updated.')
    })

    socket.on('note:deleted', ({ id }) => {
      setNotes((currentNotes) => currentNotes.filter((n) => n.id !== id))
      toast.success('Note deleted.')
    })

    return () => {
      socket.off('note:created')
      socket.off('note:updated')
      socket.off('note:deleted')
    }
  }, [])

  useEffect(() => {
    function syncProfile() {
      setProfile(getStoredProfile())
    }

    window.addEventListener('storage', syncProfile)
    window.addEventListener('focus', syncProfile)

    return () => {
      window.removeEventListener('storage', syncProfile)
      window.removeEventListener('focus', syncProfile)
    }
  }, [])

  useEffect(() => {
    function onKeyDown(event) {
      const isModifier = event.ctrlKey || event.metaKey
      if (!isModifier) return

      const key = event.key.toLowerCase()
      if (key === 'k' || key === 'f') {
        event.preventDefault()
        searchInputRef.current?.focus()
      }

      if (key === 'n') {
        event.preventDefault()
        setEditingNote(null)
        setShowEditor(true)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function openDeleteDialog(note) {
    setDeleteTarget(note)
    setDeleteDialogOpen(true)
  }

  async function confirmDelete() {
    if (!deleteTarget) return

    try {
      await api.delete(`/api/notes/${deleteTarget.id}`)
      setNotes((currentNotes) => currentNotes.filter((currentNote) => currentNote.id !== deleteTarget.id))
      toast.success('Note deleted.')
    } catch (requestError) {
      const message = requestError.response?.data?.error || 'Unable to delete this note.'
      setError(message)
      toast.error(message)
    } finally {
      setDeleteTarget(null)
      setDeleteDialogOpen(false)
    }
  }

  function exportNotes() {
    if (notes.length === 0) {
      toast.error('No notes to export.')
      return
    }

    const markdown = notes
      .map((note) => {
        const textContent = stripHtml(note.content)
        return `## ${note.title}\n\n${textContent}\n`
      })
      .join('\n---\n\n')

    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `khayaal-notes-${new Date().toISOString().split('T')[0]}.md`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('Notes exported.')
  }

  async function handleImportFile(event) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const title = file.name.replace(/\.(md|txt)$/i, '') || 'Imported Note'
      await api.post('/api/notes', { title, content: text })
      await loadNotes()
      toast.success('Note imported successfully.')
    } catch (err) {
      toast.error('Unable to import note.')
    } finally {
      if (importInputRef.current) {
        importInputRef.current.value = ''
      }
    }
  }

  const filteredNotes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return notes

    return notes.filter((note) => {
      const textContent = stripHtml(note.content)
      return `${note.title} ${textContent}`.toLowerCase().includes(normalizedQuery)
    })
  }, [notes, query])

  const isSearching = query.trim().length > 0

  return (
    <main className="dashboard-shell relative min-h-screen overflow-hidden text-white">
      <div className="dashboard-grid" />

      <nav className="relative border-b border-[#1e1e2e] bg-[#0f0f16]/85 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-10">
          <div className="flex items-center text-base font-semibold tracking-[0.12em] uppercase text-white/90">
            <span className="font-bold text-white">Khayaal</span>
            <span className="mx-3 h-4 w-px bg-white/25" aria-hidden="true" />
            <span className="wordmark-urdu gradient-text pb-2 leading-loose text-base">خیال</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={exportNotes}
              className="text-white/60 hover:text-white hover:bg-white/10"
              aria-label="Export notes"
            >
              <Download size={16} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => importInputRef.current?.click()}
              className="text-white/60 hover:text-white hover:bg-white/10"
              aria-label="Import notes"
            >
              <Upload size={16} />
            </Button>
            <input
              ref={importInputRef}
              type="file"
              accept=".md,.txt"
              onChange={handleImportFile}
              className="hidden"
            />
            <Link
              to="/profile"
              className="group relative grid size-10 place-items-center overflow-hidden rounded-full border border-indigo-400/40 bg-gradient-to-br from-indigo-500/30 to-purple-600/30 text-xs font-semibold text-white transition hover:brightness-110"
              aria-label="Go to profile"
            >
              {profile.avatar ? (
                <img src={profile.avatar} alt="Profile avatar" className="h-full w-full object-cover" />
              ) : (
                avatarInitials
              )}
            </Link>
            <Button
              type="button"
              variant="outline"
              onClick={handleLogout}
              className="border-white/10 bg-white/[0.02] text-white/70 hover:bg-white/[0.08] hover:text-white"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Log out</span>
            </Button>
          </div>
        </div>
      </nav>

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-14">
        <header className="flex flex-col justify-between gap-7 md:flex-row md:items-end">
          <div>
            <p className="mb-4 flex items-center gap-2 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-indigo-300">
              <Sparkles size={14} /> Your workspace
            </p>
            <h1 className="text-3xl font-semibold tracking-[-0.05em] sm:text-5xl">
              Good thinking, <span className="text-white/40">organized.</span>
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-white/45">
              A quiet place for the ideas worth keeping.
            </p>
          </div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              type="button"
              onClick={() => {
                setEditingNote(null)
                setShowEditor(true)
              }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:brightness-110"
            >
              <Plus size={18} />
              New Note
            </Button>
          </motion.div>
        </header>

        <div className="mt-10 flex flex-col justify-between gap-4 border-b border-white/10 pb-5 md:flex-row md:items-center">
          <p className="text-sm text-white/40">
            {isSearching ? (
              <>
                Showing <span className="font-medium text-white">{filteredNotes.length}</span> of <span className="font-medium text-white">{notes.length}</span> notes
              </>
            ) : (
              <>
                <span className="font-medium text-white">{notes.length}</span> {notes.length === 1 ? 'note' : 'notes'} in your workspace
              </>
            )}
          </p>

          <label className="flex w-full items-center gap-2 rounded-2xl border border-[#1e1e2e] bg-[#111118] px-3 py-2.5 text-sm text-slate-400 shadow-inner shadow-black/10 transition focus-within:border-indigo-400/70 focus-within:bg-[#181825] md:w-auto">
            <Search size={16} />
            <input
              ref={searchInputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search notes"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25 md:w-64"
            />
          </label>
        </div>

        {error && (
          <p role="alert" className="mt-6 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}

        {loading ? (
          <div className="grid gap-4 pt-8 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((key) => (
              <div key={key} className="h-52 animate-pulse rounded-[28px] border border-white/10 bg-white/[0.04]" />
            ))}
          </div>
        ) : filteredNotes.length ? (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              show: { transition: { staggerChildren: 0.08 } },
            }}
            className="grid gap-5 pt-8 sm:grid-cols-2 xl:grid-cols-3"
          >
            {filteredNotes.map((note) => {
              const previewText = stripHtml(note.content)
              const updatedAt = note.updated_at || note.updatedAt || note.created_at || note.createdAt

              return (
                <motion.article
                  key={note.id}
                  variants={{
                    hidden: { opacity: 0, y: 18 },
                    show: { opacity: 1, y: 0 },
                  }}
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => {
                    setEditingNote(note)
                    setShowEditor(true)
                  }}
                  className="group cursor-pointer"
                >
                  <Card className="note-card h-full rounded-[28px] p-0 transition-shadow duration-200 group-hover:shadow-[0_24px_45px_rgba(99,102,241,0.16)]">
                    <CardHeader className="space-y-0 px-5 pb-0 pt-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-white/35">
                            Edited {formatRelativeTime(updatedAt)}
                          </span>
                          <p className="mt-1 text-xs text-slate-500">{countWords(previewText)} words</p>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Copy ${note.title}`}
                            onClick={(event) => {
                              event.stopPropagation()
                              navigator.clipboard.writeText(previewText)
                              toast.success('Note copied to clipboard.')
                            }}
                            className="h-8 w-8 rounded-xl text-slate-500 opacity-0 transition group-hover:opacity-100 hover:bg-indigo-500/10 hover:text-indigo-200"
                          >
                            <Copy size={15} />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Delete ${note.title}`}
                            onClick={(event) => {
                              event.stopPropagation()
                              openDeleteDialog(note)
                            }}
                            className="h-8 w-8 rounded-xl text-slate-500 opacity-0 transition group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-300"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="px-5 pb-5 pt-4">
                      <h2 className="line-clamp-1 text-xl font-semibold tracking-[-0.04em] text-white">{note.title}</h2>
                      <p className="mt-3 line-clamp-4 text-sm leading-6 text-white/50">{previewText || 'No content yet.'}</p>
                    </CardContent>
                  </Card>
                </motion.article>
              )
            })}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.04, 1], opacity: [0.9, 1, 0.9] }}
              transition={{ duration: 2.2, repeat: Infinity }}
              className="mb-6 grid size-20 place-items-center rounded-[28px] border border-indigo-400/20 bg-indigo-500/10 text-indigo-300 shadow-lg shadow-indigo-500/10"
            >
              <FileText size={32} />
            </motion.div>
            <h2 className="text-xl font-semibold text-white">
              {isSearching ? 'No results found' : 'Your blank page is waiting'}
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-white/45">
              {isSearching ? 'Try another keyword or create a fresh note.' : 'Capture the next idea before it slips away.'}
            </p>
            <Button
              type="button"
              onClick={() => {
                setEditingNote(null)
                setShowEditor(true)
              }}
              className="mt-8 inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-sm font-semibold text-white"
            >
              <Plus size={17} />
              Create your first note
            </Button>
          </motion.div>
        )}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="border border-white/10 bg-slate-950/90 p-0 text-white shadow-[0_30px_80px_rgba(2,6,23,0.8)] backdrop-blur-xl sm:max-w-md">
          <div className="p-6">
            <DialogHeader className="space-y-3 text-left">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-red-500/10 text-red-300">
                <Trash2 size={18} />
              </div>
              <DialogTitle className="text-xl font-semibold text-white">Delete note?</DialogTitle>
              <DialogDescription className="text-sm text-slate-300">
                This will permanently remove <span className="font-medium text-white">{deleteTarget?.title || 'this note'}</span> from your workspace.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="mt-6 flex-row justify-end border-t border-white/10 pt-4">
              <Button type="button" variant="ghost" onClick={() => setDeleteDialogOpen(false)} className="text-white/60 hover:text-white hover:bg-white/[0.04]">
                Cancel
              </Button>
              <Button type="button" onClick={confirmDelete} className="bg-red-500 text-white hover:bg-red-400">
                Delete note
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {showEditor && (
        <NoteEditorModal
          note={editingNote}
          onClose={() => setShowEditor(false)}
          onSaved={async () => {
            await loadNotes()
          }}
        />
      )}
    </main>
  )
}

export default DashboardPage
