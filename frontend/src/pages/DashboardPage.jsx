import { AnimatePresence, motion } from 'framer-motion'
import { Download, FileText, Keyboard, LogOut, Plus, Search, Upload } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import NoteCard from '../components/NoteCard'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'
import { useAuth } from '../context/AuthContext'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import api from '../lib/axios'
import { getAvatarDisplayName, getInitials, getStoredProfile } from '../lib/profile'
import { initSocket } from '../lib/socket'
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

function DashboardPage({ archived = false }) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [profile, setProfile] = useState(() => getStoredProfile())
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingNote, setEditingNote] = useState(null)
  const [showEditor, setShowEditor] = useState(false)
  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const searchInputRef = useRef(null)
  const importInputRef = useRef(null)

  const avatarName = useMemo(() => getAvatarDisplayName(user, profile), [profile, user])
  const avatarInitials = useMemo(() => getInitials(avatarName), [avatarName])

  const loadNotes = useCallback(async () => {
    try {
      setError('')
      setLoading(true)
      const params = {}
      if (archived) params.archived = 'true'
      if (activeTag) params.tag = activeTag
      const response = await api.get('/api/notes', { params })
      setNotes(Array.isArray(response.data) ? response.data : response.data.notes || [])
    } catch (requestError) {
      const message = requestError.response?.data?.error || 'Unable to load your notes.'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [activeTag, archived])

  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  useEffect(() => {
    const socket = initSocket()

    socket.on('note:created', (newNote) => {
      if (archived) return
      setNotes((currentNotes) => (currentNotes.some((n) => n.id === newNote.id) ? currentNotes : [newNote, ...currentNotes]))
    })

    socket.on('note:updated', (updatedNote) => {
      setNotes((currentNotes) => {
        const belongsOnPage = Boolean(updatedNote.is_archived) === archived
        if (!belongsOnPage) return currentNotes.filter((n) => n.id !== updatedNote.id)
        return currentNotes.some((n) => n.id === updatedNote.id)
          ? currentNotes.map((n) => (n.id === updatedNote.id ? updatedNote : n))
          : [updatedNote, ...currentNotes]
      })
    })

    socket.on('note:deleted', ({ id }) => {
      setNotes((currentNotes) => currentNotes.filter((n) => n.id !== id))
    })

    return () => {
      socket.off('note:created')
      socket.off('note:updated')
      socket.off('note:deleted')
    }
  }, [archived])

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

  const openNewNote = useCallback(() => {
    if (archived) return
    setEditingNote(null)
    setShowEditor(true)
  }, [archived])

  useKeyboardShortcuts({
    onNewNote: openNewNote,
    onEscape: () => {
      setShortcutsOpen(false)
      setShowEditor(false)
      setDeleteDialogOpen(false)
    },
  })

  function handleLogout() {
    logout()
    navigate('/login')
  }

  async function patchNoteOptimistically(noteId, optimisticNote, request, successMessage, rollbackMessage) {
    const previousNotes = notes
    setNotes((currentNotes) => currentNotes.map((note) => (note.id === noteId ? optimisticNote : note)))

    try {
      const response = await request()
      setNotes((currentNotes) => currentNotes.map((note) => (note.id === noteId ? response.data : note)))
      toast.success(successMessage)
    } catch (requestError) {
      setNotes(previousNotes)
      toast.error(requestError.response?.data?.error || rollbackMessage)
    }
  }

  function handlePin(note) {
    patchNoteOptimistically(
      note.id,
      { ...note, is_pinned: !note.is_pinned },
      () => api.patch(`/api/notes/${note.id}/pin`),
      note.is_pinned ? 'Note unpinned.' : 'Note pinned.',
      'Unable to update pin.'
    )
  }

  function handleColor(note, color) {
    patchNoteOptimistically(
      note.id,
      { ...note, color },
      () => api.patch(`/api/notes/${note.id}/color`, { color }),
      'Color updated.',
      'Unable to update color.'
    )
  }

  async function handleArchive(note) {
    const previousNotes = notes
    setNotes((currentNotes) => currentNotes.filter((currentNote) => currentNote.id !== note.id))

    try {
      await api.patch(`/api/notes/${note.id}/archive`)
      toast.success(archived ? 'Note restored.' : 'Note archived.')
    } catch (requestError) {
      setNotes(previousNotes)
      toast.error(requestError.response?.data?.error || 'Unable to update archive.')
    }
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
      .map((note) => `## ${note.title}\n\n${stripHtml(note.content)}\n`)
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
    } catch {
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

  const allTags = useMemo(() => {
    const tagMap = new Map()
    notes.forEach((note) => {
      note.tags?.forEach((tag) => tagMap.set(tag.name, tag))
    })
    return [...tagMap.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [notes])

  const pinnedNotes = filteredNotes.filter((note) => note.is_pinned)
  const unpinnedNotes = filteredNotes.filter((note) => !note.is_pinned)
  const isSearching = query.trim().length > 0 || activeTag.length > 0

  function renderNoteGrid(items) {
    return (
      <motion.div
        layout
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.08 } } }}
        className="grid gap-5 pt-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        <AnimatePresence mode="popLayout">
          {items.map((note) => {
            const previewText = stripHtml(note.content)
            const updatedAt = note.updated_at || note.updatedAt || note.created_at || note.createdAt

            return (
              <NoteCard
                key={note.id}
                note={note}
                previewText={previewText}
                wordCount={countWords(previewText)}
                updatedLabel={formatRelativeTime(updatedAt)}
                archived={archived}
                onOpen={() => {
                  if (!archived) {
                    setEditingNote(note)
                    setShowEditor(true)
                  }
                }}
                onPin={handlePin}
                onColor={handleColor}
                onArchive={handleArchive}
                onDelete={openDeleteDialog}
              />
            )
          })}
        </AnimatePresence>
      </motion.div>
    )
  }

  return (
    <main className="dashboard-shell relative min-h-screen overflow-hidden text-white">
      <div className="dashboard-grid" />

      <nav className="relative border-b border-[#1e1e2e] bg-[#0f0f16]/85 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-10">
          <div className="flex items-center text-base font-semibold uppercase text-white/90">
            <span className="font-bold text-white">Khayaal</span>
            <span className="mx-3 h-4 w-px bg-white/25" aria-hidden="true" />
            <span className="wordmark-urdu gradient-text pb-2 leading-loose text-base">خیال</span>
          </div>

          <div className="flex flex-1 items-center justify-end gap-2">
            <Link to="/dashboard" className={`rounded-lg px-3 py-2 text-sm ${archived ? 'text-slate-400 hover:text-white' : 'bg-white/10 text-white'}`}>
              Notes
            </Link>
            <Link to="/archive" className={`rounded-lg px-3 py-2 text-sm ${archived ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}>
              Archive
            </Link>
            {!archived && (
              <>
                <Button type="button" variant="ghost" onClick={exportNotes} className="text-[#94a3b8] hover:text-white hover:bg-white/10" aria-label="Export notes">
                  <Download size={16} />
                  <span>Export</span>
                </Button>
                <Button type="button" variant="ghost" onClick={() => importInputRef.current?.click()} className="text-[#94a3b8] hover:text-white hover:bg-white/10" aria-label="Import notes">
                  <Upload size={16} />
                  <span>Import</span>
                </Button>
                <input ref={importInputRef} type="file" accept=".md,.txt" onChange={handleImportFile} className="hidden" />
              </>
            )}
            <div className="relative">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Keyboard shortcuts"
                onClick={() => setShortcutsOpen((open) => !open)}
                className="text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <Keyboard size={16} />
              </Button>
              {shortcutsOpen && (
                <div className="absolute right-0 top-11 z-20 w-64 rounded-xl border border-white/10 bg-[#111118] p-3 shadow-2xl">
                  <table className="w-full text-left text-xs text-slate-300">
                    <tbody>
                      <tr><td className="py-1 font-medium text-white">Ctrl+N</td><td className="py-1">New note</td></tr>
                      <tr><td className="py-1 font-medium text-white">Ctrl+S</td><td className="py-1">Save note</td></tr>
                      <tr><td className="py-1 font-medium text-white">Escape</td><td className="py-1">Close modal</td></tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <label className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-[#1e1e2e] bg-[#111118] px-3 py-2.5 text-sm text-slate-400 shadow-inner shadow-black/10 transition focus-within:border-indigo-400/70 focus-within:bg-[#181825] sm:max-w-xs md:max-w-sm">
              <Search size={16} />
              <input ref={searchInputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search notes" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25" />
            </label>
            <Link to="/profile" className="grid size-10 cursor-pointer place-items-center overflow-hidden rounded-full border border-indigo-400/40 bg-indigo-500/20 text-xs font-semibold text-white" aria-label="Go to profile">
              {profile.avatar ? <img src={profile.avatar} alt="Profile avatar" className="h-full w-full object-cover" /> : avatarInitials}
            </Link>
            <Button type="button" variant="outline" onClick={handleLogout} className="border-white/10 bg-white/[0.02] text-white/70 hover:bg-white/[0.08] hover:text-white">
              <LogOut size={16} />
              <span className="hidden sm:inline">Log out</span>
            </Button>
          </div>
        </div>
      </nav>

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-14">
        <div className="flex flex-col items-start justify-between gap-4 border-b border-white/10 pb-5 md:flex-row md:items-center">
          {!archived ? (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button type="button" onClick={openNewNote} className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:brightness-110">
                <Plus size={18} />
                New Note
              </Button>
            </motion.div>
          ) : (
            <h1 className="text-xl font-semibold text-white">Archived notes</h1>
          )}

          <p className="text-sm text-white/40">
            {isSearching ? (
              <>Showing <span className="font-medium text-white">{filteredNotes.length}</span> of <span className="font-medium text-white">{notes.length}</span> notes</>
            ) : (
              <><span className="font-medium text-white">{notes.length}</span> {notes.length === 1 ? 'note' : 'notes'} in your workspace</>
            )}
          </p>
        </div>

        {!!allTags.length && !archived && (
          <div className="flex flex-wrap gap-2 pt-5">
            {allTags.map((tag) => (
              <button key={tag.name} type="button" onClick={() => setActiveTag(activeTag === tag.name ? '' : tag.name)}>
                <Badge className={activeTag === tag.name ? 'bg-indigo-500/30 text-white' : 'hover:bg-white/10'}>
                  {tag.name}
                </Badge>
              </button>
            ))}
          </div>
        )}

        {error && <p role="alert" className="mt-6 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>}

        {loading ? (
          <div className="grid gap-4 pt-8 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((key) => <div key={key} className="h-52 animate-pulse rounded-[28px] border border-white/10 bg-white/[0.04]" />)}
          </div>
        ) : filteredNotes.length ? (
          <div className="space-y-8 pt-4">
            {!archived && !!pinnedNotes.length && (
              <section>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Pinned</p>
                {renderNoteGrid(pinnedNotes)}
              </section>
            )}
            <section>
              {!archived && !!pinnedNotes.length && <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">All notes</p>}
              {renderNoteGrid(archived ? filteredNotes : unpinnedNotes)}
            </section>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="flex flex-col items-center justify-center py-24 text-center">
            <motion.div animate={{ scale: [1, 1.04, 1], opacity: [0.9, 1, 0.9] }} transition={{ duration: 2.2, repeat: Infinity }} className="mb-6 grid size-20 place-items-center rounded-[28px] border border-indigo-400/20 bg-indigo-500/10 text-indigo-300 shadow-lg shadow-indigo-500/10">
              <FileText size={32} />
            </motion.div>
            <h2 className="text-xl font-semibold text-white">{isSearching ? 'No results found' : archived ? 'Archive is empty' : 'Your blank page is waiting'}</h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-white/45">{isSearching ? 'Try another keyword or tag.' : archived ? 'Archived notes will appear here.' : 'Capture the next idea before it slips away.'}</p>
            {!archived && (
              <Button type="button" onClick={openNewNote} className="mt-8 inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-sm font-semibold text-white">
                <Plus size={17} />
                Create your first note
              </Button>
            )}
          </motion.div>
        )}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="border border-white/10 bg-slate-950/90 p-0 text-white shadow-[0_30px_80px_rgba(2,6,23,0.8)] backdrop-blur-xl sm:max-w-md">
          <div className="p-6">
            <DialogHeader className="space-y-3 text-left">
              <DialogTitle className="text-xl font-semibold text-white">Delete note?</DialogTitle>
              <DialogDescription className="text-sm text-slate-300">
                This will permanently remove <span className="font-medium text-white">{deleteTarget?.title || 'this note'}</span> from your workspace.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-6 flex-row justify-end border-t border-white/10 pt-4">
              <Button type="button" variant="ghost" onClick={() => setDeleteDialogOpen(false)} className="text-white/60 hover:text-white hover:bg-white/[0.04]">Cancel</Button>
              <Button type="button" onClick={confirmDelete} className="bg-red-500 text-white hover:bg-red-400">Delete note</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {showEditor && (
        <NoteEditorModal
          note={editingNote}
          onClose={() => setShowEditor(false)}
          onSaved={({ closeAfterSave, note }) => {
            if (note?.id) {
              setNotes((prev) => {
                const exists = prev.some((currentNote) => currentNote.id === note.id)
                return exists ? prev.map((currentNote) => (currentNote.id === note.id ? note : currentNote)) : [note, ...prev]
              })
              setEditingNote(note)
            }

            if (closeAfterSave) {
              setShowEditor(false)
            }
          }}
        />
      )}
    </main>
  )
}

export default DashboardPage
