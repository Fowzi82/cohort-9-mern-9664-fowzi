import CharacterCount from '@tiptap/extension-character-count'
import Placeholder from '@tiptap/extension-placeholder'
import StarterKit from '@tiptap/starter-kit'
import { EditorContent, useEditor } from '@tiptap/react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bold, FileText, Italic, List, ListOrdered, LoaderCircle, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
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

function extractNoteId(payload) {
  return payload?.id || payload?.note?.id || payload?.noteId || null
}

function NoteEditorModal({ note, onClose, onSaved }) {
  const [title, setTitle] = useState(note?.title || '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveState, setSaveState] = useState('idle')
  const [currentNoteId, setCurrentNoteId] = useState(note?.id || null)
  const [version, setVersion] = useState(0)
  const baselineRef = useRef({ title: note?.title || '', content: note?.content || '' })
  const saveTimerRef = useRef(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Start writing...' }),
      CharacterCount,
    ],
    content: note?.content || '',
    onUpdate: () => {
      setVersion((currentValue) => currentValue + 1)
    },
    editorProps: {
      attributes: {
        class:
          'tiptap-editor mt-8 min-h-[300px] w-full rounded-2xl border border-[#1e1e2e] bg-[#111118] p-4 text-base leading-7 text-white/80 outline-none transition focus:border-indigo-400/70 focus:ring-4 focus:ring-indigo-500/15',
      },
    },
    immediatelyRender: false,
  })

  const htmlContent = editor?.getHTML() || ''
  const charCount = editor?.storage?.characterCount?.characters() || 0
  const wordCount = editor?.storage?.characterCount?.words() || 0

  const hasUnsavedChanges = useMemo(() => {
    const baseline = baselineRef.current
    return title !== baseline.title || htmlContent !== baseline.content
  }, [title, htmlContent, version])

  useEffect(() => {
    const nextTitle = note?.title || ''
    const nextContent = note?.content || ''
    setTitle(nextTitle)
    setCurrentNoteId(note?.id || null)
    baselineRef.current = { title: nextTitle, content: nextContent }
    setSaveState('idle')
    setError('')

    if (editor) {
      editor.commands.setContent(nextContent, { emitUpdate: false })
    }
  }, [editor, note])

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  useEffect(() => {
    if (!editor || !hasUnsavedChanges) return

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }

    saveTimerRef.current = setTimeout(() => {
      saveNote({ closeAfterSave: false, silent: true })
    }, 2000)

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [editor, hasUnsavedChanges, htmlContent, title])

  async function saveNote({ closeAfterSave, silent }) {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      if (!silent) {
        setError('A title is required')
      }
      return
    }

    setError('')
    setSaving(true)
    setSaveState('saving')

    try {
      const payload = {
        title: trimmedTitle,
        content: editor?.getHTML() || '',
      }

      let response
      if (currentNoteId) {
        response = await api.put(`/api/notes/${currentNoteId}`, payload)
      } else {
        response = await api.post('/api/notes', payload)
        const createdId = extractNoteId(response?.data)
        if (createdId) {
          setCurrentNoteId(createdId)
        }
      }

      const nextContent = editor?.getHTML() || ''
      baselineRef.current = { title: trimmedTitle, content: nextContent }
      setSaveState('saved')

      if (!silent) {
        toast.success(currentNoteId ? 'Note updated.' : 'Note created.')
      }

      if (onSaved) {
        await onSaved({ closeAfterSave, noteId: currentNoteId || extractNoteId(response?.data) })
      }

      if (closeAfterSave) {
        onClose()
      }
    } catch (requestError) {
      const message = requestError.response?.data?.error || 'Unable to save this note.'
      setSaveState('error')
      setError(message)
      toast.error(message)
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
                    {currentNoteId ? 'Edit note' : 'New note'}
                  </DialogDescription>
                  <DialogTitle className="mt-1 text-lg font-semibold tracking-tight text-white">
                    {currentNoteId ? 'Refine your thought' : 'Capture a thought'}
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

            <form
              onSubmit={(event) => {
                event.preventDefault()
                saveNote({ closeAfterSave: true, silent: false })
              }}
              className="p-6 sm:p-8"
            >
              <Input
                autoFocus
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value)
                  setVersion((currentValue) => currentValue + 1)
                }}
                placeholder="Untitled note"
                className="h-auto border-0 bg-transparent px-0 text-3xl font-semibold tracking-[-0.05em] text-white placeholder:text-white/20 focus-visible:ring-0 sm:text-4xl"
              />

              <div className="mt-6 flex flex-wrap items-center gap-2 rounded-xl border border-[#1e1e2e] bg-[#0f0f16] p-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  className={editor?.isActive('bold') ? 'bg-white/10 text-white' : 'text-slate-300'}
                  aria-label="Bold"
                >
                  <Bold size={16} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  className={editor?.isActive('italic') ? 'bg-white/10 text-white' : 'text-slate-300'}
                  aria-label="Italic"
                >
                  <Italic size={16} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                  className={editor?.isActive('bulletList') ? 'bg-white/10 text-white' : 'text-slate-300'}
                  aria-label="Bullet list"
                >
                  <List size={16} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                  className={editor?.isActive('orderedList') ? 'bg-white/10 text-white' : 'text-slate-300'}
                  aria-label="Ordered list"
                >
                  <ListOrdered size={16} />
                </Button>
              </div>

              <EditorContent editor={editor} />

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                <span>{wordCount} words · {charCount} characters</span>
                <span className="font-medium text-indigo-300">
                  {saveState === 'saving' && 'Saving...'}
                  {saveState === 'saved' && 'Saved'}
                  {saveState === 'error' && 'Save failed'}
                  {saveState === 'idle' && 'Ready'}
                </span>
              </div>

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
