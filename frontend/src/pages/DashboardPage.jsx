import { motion } from 'framer-motion'
import { FileText, LogOut, Plus, Search, Sparkles, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import NoteEditorModal from './NoteEditorModal'

function formatDate(value) {
  if (!value) return 'Recently created'
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

function DashboardPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingNote, setEditingNote] = useState(null)
  const [showEditor, setShowEditor] = useState(false)
  const [query, setQuery] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  async function loadNotes() {
    try {
      setError('')
      const response = await api.get('/api/notes')
      setNotes(Array.isArray(response.data) ? response.data : response.data.notes || [])
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to load your notes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotes()
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
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to delete this note.')
    } finally {
      setDeleteTarget(null)
      setDeleteDialogOpen(false)
    }
  }

  const filteredNotes = useMemo(
    () => notes.filter((note) => `${note.title} ${note.content}`.toLowerCase().includes(query.toLowerCase())),
    [notes, query],
  )

  return (
    <main className="dashboard-shell relative min-h-screen overflow-hidden text-white">
      <div className="dashboard-grid" />

      <nav className="relative border-b border-[#1e1e2e] bg-[#0f0f16]/85 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
          <div className="flex items-center text-base font-semibold tracking-[0.12em] uppercase text-white/90">
            <span className="text-white font-bold">Lumen</span>
            <span className="gradient-text ml-2">Notes</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-white/45 sm:block">{user?.email}</span>
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

      <div className="relative mx-auto max-w-7xl px-6 py-10 lg:px-10 lg:py-14">
        <header className="flex flex-col justify-between gap-7 md:flex-row md:items-end">
          <div>
            <p className="mb-4 flex items-center gap-2 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-indigo-300">
              <Sparkles size={14} /> Your workspace
            </p>
            <h1 className="text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
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

        <div className="mt-12 flex flex-col justify-between gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center">
          <p className="text-sm text-white/40">
            <span className="font-medium text-white">{notes.length}</span> {notes.length === 1 ? 'note' : 'notes'} in your workspace
          </p>

          <label className="flex w-full items-center gap-2 rounded-2xl border border-[#1e1e2e] bg-[#111118] px-3 py-2.5 text-sm text-slate-400 shadow-inner shadow-black/10 transition focus-within:border-indigo-400/70 focus-within:bg-[#181825] sm:w-auto">
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search notes"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25 sm:w-52"
            />
          </label>
        </div>

        {error && (
          <p role="alert" className="mt-6 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}

        {loading ? (
          <div className="grid gap-4 pt-8 sm:grid-cols-2 lg:grid-cols-3">
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
            className="grid gap-5 pt-8 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filteredNotes.map((note) => (
              <motion.article
                key={note.id}
                variants={{
                  hidden: { opacity: 0, y: 18 },
                  show: { opacity: 1, y: 0 },
                }}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                onClick={() => {
                  setEditingNote(note)
                  setShowEditor(true)
                }}
                className="group cursor-pointer"
              >
                <Card className="note-card h-full rounded-[28px] p-0">
                  <CardHeader className="space-y-0 px-5 pb-0 pt-5">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-white/35">
                        {formatDate(note.created_at || note.createdAt)}
                      </span>

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
                  </CardHeader>

                  <CardContent className="px-5 pb-5 pt-4">
                    <h2 className="line-clamp-1 text-xl font-semibold tracking-[-0.04em] text-white">{note.title}</h2>
                    <p className="mt-3 line-clamp-4 text-sm leading-6 text-white/50">{note.content || 'No content yet.'}</p>
                  </CardContent>
                </Card>
              </motion.article>
            ))}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-6 grid size-20 place-items-center rounded-[28px] border border-indigo-400/20 bg-indigo-500/10 text-indigo-300 shadow-lg shadow-indigo-500/10">
              <FileText size={32} />
            </div>
            <h2 className="text-xl font-semibold text-white">
              {query ? 'No notes match your search' : 'Your blank page is waiting'}
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-white/45">
              {query ? 'Try a different keyword or create a fresh note.' : 'Capture the next idea before it slips away.'}
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
          </div>
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
            setShowEditor(false)
            await loadNotes()
          }}
        />
      )}
    </main>
  )
}

export default DashboardPage
