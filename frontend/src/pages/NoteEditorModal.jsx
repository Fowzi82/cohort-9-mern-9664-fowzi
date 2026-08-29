import CharacterCount from '@tiptap/extension-character-count'
import Placeholder from '@tiptap/extension-placeholder'
import StarterKit from '@tiptap/starter-kit'
import { EditorContent, useEditor } from '@tiptap/react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bold, Check, Download, FileText, Italic, List, ListOrdered, LoaderCircle, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import TagInput from '../components/TagInput'
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
import { useDebouncedCallback } from '../hooks/useDebouncedCallback'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import api from '../lib/axios'
import { exportNoteAsMarkdown } from '../lib/exportNoteAsMarkdown'
import { calculateReadingTime } from '../lib/readingTime'

function extractNoteId(payload) {
  return payload?.id || payload?.note?.id || payload?.noteId || payload?.insertId || null
}

function normalizeSavedNote(payload, fallback) {
  const responseNote = payload?.note || payload
  const id = extractNoteId(payload)

  if (responseNote?.id) {
    return responseNote
  }

  if (!id) {
    return null
  }

  return {
    id,
    title: fallback.title,
    content: fallback.content,
    tags: fallback.tags || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function NoteEditorModal({ note, onClose, onSaved }) {
  const [title, setTitle] = useState(note?.title || '')
  const [tags, setTags] = useState(note?.tags || [])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveState, setSaveState] = useState('idle')
  const [currentNoteId, setCurrentNoteId] = useState(note?.id || null)
  const [, setVersion] = useState(0)
  const [baseline, setBaseline] = useState({ title: note?.title || '', content: note?.content || '' })
  const [editorHydrated, setEditorHydrated] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Start writing...' }),
      CharacterCount,
    ],
    content: note?.content || '',
    onUpdate: () => setVersion((currentValue) => currentValue + 1),
    editorProps: {
      attributes: {
        class:
          'tiptap-editor mt-8 min-h-[300px] w-full rounded-2xl border border-[#1e1e2e] bg-[#111118] text-base leading-7 text-white/80 outline-none transition focus:border-indigo-400/70 focus:ring-4 focus:ring-indigo-500/15',
      },
    },
    immediatelyRender: false,
  })

  const htmlContent = editor?.getHTML() || ''
  const charCount = editor?.storage?.characterCount?.characters() || 0
  const wordCount = editor?.storage?.characterCount?.words() || 0
  const readingTime = calculateReadingTime(wordCount)

  const hasUnsavedChanges = useMemo(() => {
    return title !== baseline.title || htmlContent !== baseline.content
  }, [baseline, title, htmlContent])

  async function saveNote({ closeAfterSave, silent }) {
    if (!editorHydrated || !editor) {
      return
    }

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
        tags,
      }

      let response
      const isNewNote = !currentNoteId
      if (currentNoteId) {
        response = await api.patch(`/api/notes/${currentNoteId}`, {
          title: payload.title,
          content: payload.content,
        })
      } else {
        response = await api.post('/api/notes', {
          title: payload.title,
          content: payload.content,
        })
        const createdId = extractNoteId(response?.data)
        if (createdId) {
          setCurrentNoteId(createdId)
        }
      }

      const nextContent = editor?.getHTML() || ''
      setBaseline({ title: trimmedTitle, content: nextContent })
      setSaveState('saved')

      if (!silent) {
        toast.success(currentNoteId ? 'Note updated.' : 'Note created.')
      }

      if (onSaved) {
        const savedNote = normalizeSavedNote(response?.data, payload)
        await onSaved({ closeAfterSave, isNewNote, noteId: currentNoteId || extractNoteId(response?.data), note: savedNote })
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

  const autoSave = useDebouncedCallback(() => {
    saveNote({ closeAfterSave: false, silent: true })
  }, 2000)

  useKeyboardShortcuts({
    onSave: () => saveNote({ closeAfterSave: false, silent: false }),
    onEscape: onClose,
  })

  useEffect(() => {
    setEditorHydrated(false)

    if (!editor) {
      return
    }

    const nextTitle = note?.title || ''
    const nextContent = note?.content || ''
    setTitle(nextTitle)
    setTags(note?.tags || [])
    setCurrentNoteId(note?.id || null)
    setBaseline({ title: nextTitle, content: nextContent })
    setSaveState('idle')
    setError('')

    editor.commands.setContent(nextContent, { emitUpdate: false })
    setEditorHydrated(true)
  }, [editor, note])

  useEffect(() => {
    if (!editorHydrated || !editor) return
    if (!hasUnsavedChanges) return

    setSaveState('unsaved')
    if (currentNoteId) {
      autoSave.debounced()
    }
  }, [autoSave, currentNoteId, editor, editorHydrated, hasUnsavedChanges, htmlContent, title])

  async function addTag(name) {
    if (!currentNoteId) {
      toast.error('Save the note before adding tags.')
      return
    }

    try {
      const response = await api.post(`/api/notes/${currentNoteId}/tags`, { name })
      setTags(response.data?.tags || [])
      onSaved?.({ closeAfterSave: false, isNewNote: false, note: response.data })
      toast.success('Tag added.')
    } catch (requestError) {
      toast.error(requestError.response?.data?.error || 'Unable to add tag.')
    }
  }

  async function removeTag(tag) {
    if (!currentNoteId || !tag.id) return

    try {
      const response = await api.delete(`/api/notes/${currentNoteId}/tags/${tag.id}`)
      setTags(response.data?.tags || [])
      onSaved?.({ closeAfterSave: false, isNewNote: false, note: response.data })
      toast.success('Tag removed.')
    } catch (requestError) {
      toast.error(requestError.response?.data?.error || 'Unable to remove tag.')
    }
  }

  function downloadNote() {
    exportNoteAsMarkdown(title || 'Untitled note', editor || htmlContent)
    toast.success('Note downloaded.')
  }

  return (
    <AnimatePresence>
      <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
        <DialogContent showCloseButton={false} className="max-w-3xl sm:max-w-3xl border border-[#1e1e2e] bg-[#111118]/95 p-0 text-white shadow-[0_30px_90px_rgba(10,10,15,0.8)] backdrop-blur-xl">
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }} transition={{ type: 'spring', stiffness: 260, damping: 22 }} className="overflow-hidden rounded-[28px]">
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

              <div className="flex items-center gap-2">
                <motion.span
                  key={saveState}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`hidden items-center gap-1 text-sm font-medium sm:inline-flex ${
                    saveState === 'saved' ? 'text-emerald-300' : saveState === 'saving' ? 'text-amber-300' : 'text-slate-400'
                  }`}
                >
                  {saveState === 'saved' && <Check size={14} />}
                  {saveState === 'unsaved' && 'Unsaved changes'}
                  {saveState === 'saving' && 'Saving...'}
                  {saveState === 'saved' && 'Saved'}
                  {saveState === 'error' && 'Save failed'}
                  {saveState === 'idle' && 'Ready'}
                </motion.span>
                <Button type="button" variant="ghost" size="icon-sm" onClick={downloadNote} className="rounded-xl text-white/40 hover:bg-white/5 hover:text-white" aria-label="Download note">
                  <Download size={18} />
                </Button>
                <Button type="button" variant="ghost" size="icon-sm" onClick={onClose} className="rounded-xl text-white/40 hover:bg-white/5 hover:text-white" aria-label="Close editor">
                  <X size={18} />
                </Button>
              </div>
            </DialogHeader>

            <form onSubmit={(event) => {
              event.preventDefault()
              saveNote({ closeAfterSave: true, silent: false })
            }} className="p-6 sm:p-8">
              <Input
                autoFocus
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value)
                  setVersion((currentValue) => currentValue + 1)
                }}
                placeholder="Untitled note"
                className="h-auto border-0 bg-transparent pl-3 pr-0 text-3xl font-semibold text-white placeholder:text-white/20 focus-visible:ring-0 sm:text-4xl"
              />

              <TagInput tags={tags} onAddTag={addTag} onRemoveTag={removeTag} />

              <div className="mt-6 flex flex-wrap items-center gap-2 rounded-xl border border-[#1e1e2e] bg-[#0f0f16] p-2">
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => editor?.chain().focus().toggleBold().run()} className={editor?.isActive('bold') ? 'bg-white/10 text-white' : 'text-slate-300'} aria-label="Bold">
                  <Bold size={16} />
                </Button>
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => editor?.chain().focus().toggleItalic().run()} className={editor?.isActive('italic') ? 'bg-white/10 text-white' : 'text-slate-300'} aria-label="Italic">
                  <Italic size={16} />
                </Button>
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => editor?.chain().focus().toggleBulletList().run()} className={editor?.isActive('bulletList') ? 'bg-white/10 text-white' : 'text-slate-300'} aria-label="Bullet list">
                  <List size={16} />
                </Button>
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => editor?.chain().focus().toggleOrderedList().run()} className={editor?.isActive('orderedList') ? 'bg-white/10 text-white' : 'text-slate-300'} aria-label="Ordered list">
                  <ListOrdered size={16} />
                </Button>
              </div>

              <EditorContent editor={editor} />

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                <span>{wordCount} words | {charCount} characters | {readingTime} min read</span>
              </div>

              {error && <p role="alert" className="mt-3 rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-200">{error}</p>}

              <DialogFooter className="mt-8 flex-row justify-end border-t border-[#1e1e2e] pt-5">
                <Button type="button" variant="ghost" onClick={onClose} className="text-slate-300 hover:text-white hover:bg-white/[0.04]">Cancel</Button>
                <Button type="submit" disabled={saving} className="bg-gradient-to-r from-indigo-500 to-purple-600 text-sm font-semibold text-white hover:brightness-110 disabled:pointer-events-none disabled:opacity-60">
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
