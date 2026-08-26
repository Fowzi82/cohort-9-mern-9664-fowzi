import { AnimatePresence, motion } from 'framer-motion'
import { FileText, LoaderCircle, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import api from '../lib/axios'

function NoteEditorModal({ note, onClose, onSaved }) {
  const [title, setTitle] = useState(note?.title || '')
  const [content, setContent] = useState(note?.content || '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const textareaRef = useRef(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [content])

  async function handleSave(event) {
    event.preventDefault()
    if (!title.trim()) {
      setError('A title is required')
      return
    }

    setSaving(true)
    setError('')
    try {
      if (note) {
        await api.put(`/api/notes/${note.id}`, { title: title.trim(), content })
      } else {
        await api.post('/api/notes', { title: title.trim(), content })
      }
      await onSaved()
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to save this note.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          showCloseButton={false}
          className="max-w-3xl sm:max-w-3xl border border-[#1e1e2e] bg-[#111118]/95 p-0 text-white shadow-[0_30px_90px_rgba(10,10,15,0.8)] backdrop-blur-xl"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="overflow-hidden rounded-[28px]"
          >
            <DialogHeader className="flex flex-row items-center justify-between border-b border-[#1e1e2e] px-6 py-5 sm:px-8">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-r from-indigo-500/15 to-purple-600/15 text-indigo-300">
                  <FileText size={18} />
                </span>
                <div>
                  <DialogDescription className="text-[0.65rem] uppercase tracking-[0.2em] text-white/35">
                    {note ? 'Edit note' : 'New note'}
                  </DialogDescription>
                  <DialogTitle className="mt-1 text-lg font-semibold tracking-tight text-white">
                    {note ? 'Refine your thought' : 'Capture a thought'}
                  </DialogTitle>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={onClose}
                className="rounded-xl text-white/40 hover:bg-white/5 hover:text-white"
                aria-label="Close editor"
              >
                <X size={18} />
              </Button>
            </DialogHeader>

            <form onSubmit={handleSave} className="p-6 sm:p-8">
              <Input
                autoFocus
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Untitled note"
                className="h-auto border-0 bg-transparent px-0 text-3xl font-semibold tracking-[-0.05em] text-white placeholder:text-white/20 focus-visible:ring-0 sm:text-4xl"
              />

              <textarea
                ref={textareaRef}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Start writing..."
                rows="5"
                className="mt-8 min-h-[300px] w-full resize-none rounded-2xl border border-[#1e1e2e] bg-[#111118] p-4 text-base leading-7 text-white/75 outline-none placeholder:text-slate-500 focus:border-indigo-400/70 focus:ring-4 focus:ring-indigo-500/15"
              />

              {error && (
                <p role="alert" className="mt-3 rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-200">
                  {error}
                </p>
              )}

              <DialogFooter className="mt-8 flex-row justify-end border-t border-[#1e1e2e] pt-5">
                <Button type="button" variant="ghost" onClick={onClose} className="text-slate-300 hover:text-white hover:bg-white/[0.04]">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 text-sm font-semibold text-white hover:brightness-110 disabled:pointer-events-none disabled:opacity-60"
                >
                  {saving && <LoaderCircle size={16} className="animate-spin" />}
                  {saving ? 'Saving...' : 'Save note'}
                </Button>
              </DialogFooter>
            </form>
          </motion.div>
        </DialogContent>
      </Dialog>
    </AnimatePresence>
  )
}

export default NoteEditorModal
