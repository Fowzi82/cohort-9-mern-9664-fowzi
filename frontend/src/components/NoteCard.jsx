import { motion } from 'framer-motion'
import { Archive, Copy, Pin, RotateCcw, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader } from './ui/card'
import ColorPicker from './ColorPicker'

const cardColors = {
  default: { background: '#111118', border: '#1e1e2e', accent: '#64748b' },
  red: { background: '#3b1518', border: '#fca5a5', accent: '#f87171' },
  yellow: { background: '#352711', border: '#fde68a', accent: '#facc15' },
  green: { background: '#123225', border: '#86efac', accent: '#4ade80' },
  blue: { background: '#102b3f', border: '#93c5fd', accent: '#60a5fa' },
  purple: { background: '#2b1b45', border: '#c4b5fd', accent: '#a78bfa' },
}

function NoteCard({
  note,
  previewText,
  wordCount,
  updatedLabel,
  archived = false,
  onOpen,
  onPin,
  onColor,
  onArchive,
  onDelete,
}) {
  const colorStyle = cardColors[note.color || 'default'] || cardColors.default

  return (
    <motion.article
      layout
      key={note.id}
      variants={{
        hidden: { opacity: 0, y: 18 },
        show: { opacity: 1, y: 0 },
      }}
      exit={{ opacity: 0, x: -36, transition: { duration: 0.18 } }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      onClick={onOpen}
      className="group cursor-pointer"
    >
      <Card
        className="note-card h-full rounded-[28px] p-0 transition-shadow duration-200 group-hover:shadow-[0_24px_45px_rgba(99,102,241,0.16)]"
        style={{
          background: colorStyle.background,
          borderColor: colorStyle.border,
          boxShadow: `inset 4px 0 0 ${colorStyle.accent}, 0 20px 40px rgba(10, 10, 15, 0.35)`,
        }}
      >
        <CardHeader className="space-y-0 px-5 pb-0 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-white/35">
                Edited {updatedLabel}
              </span>
              <p className="mt-1 text-xs text-slate-500">{wordCount} words</p>
            </div>

            <div className="flex items-center gap-1">
              {!archived && (
                <motion.div whileTap={{ scale: 1.22 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`${note.is_pinned ? 'Unpin' : 'Pin'} ${note.title}`}
                    aria-pressed={Boolean(note.is_pinned)}
                    onClick={(event) => {
                      event.stopPropagation()
                      onPin(note)
                    }}
                    className={`h-8 w-8 rounded-xl transition hover:bg-indigo-500/10 hover:text-indigo-200 ${
                      note.is_pinned ? 'text-indigo-200 opacity-100' : 'text-slate-500 opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    <Pin size={15} fill={note.is_pinned ? 'currentColor' : 'none'} />
                  </Button>
                </motion.div>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Copy ${note.title}`}
                onClick={(event) => {
                  event.stopPropagation()
                  navigator.clipboard?.writeText(previewText)
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
                aria-label={`${archived ? 'Unarchive' : 'Archive'} ${note.title}`}
                onClick={(event) => {
                  event.stopPropagation()
                  onArchive(note)
                }}
                className="h-8 w-8 rounded-xl text-slate-500 opacity-0 transition group-hover:opacity-100 hover:bg-emerald-500/10 hover:text-emerald-200"
              >
                {archived ? <RotateCcw size={16} /> : <Archive size={16} />}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Delete ${note.title}`}
                onClick={(event) => {
                  event.stopPropagation()
                  onDelete(note)
                }}
                className="h-8 w-8 rounded-xl text-slate-500 opacity-0 transition group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-300"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-5 pb-5 pt-4">
          <h2 className="line-clamp-1 text-xl font-semibold text-white">{note.title}</h2>
          <p className="mt-3 line-clamp-4 text-sm leading-6 text-white/50">{previewText || 'No content yet.'}</p>
          {!!note.tags?.length && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {note.tags.map((tag) => (
                <Badge key={tag.id || tag.name}>{tag.name}</Badge>
              ))}
            </div>
          )}
          {!archived && (
            <div className="mt-4">
              <ColorPicker value={note.color || 'default'} onChange={(color) => onColor(note, color)} />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.article>
  )
}

export default NoteCard
