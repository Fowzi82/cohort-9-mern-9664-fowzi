import { X } from 'lucide-react'
import { useState } from 'react'
import { Badge } from './ui/badge'
import { Button } from './ui/button'

function TagInput({ tags = [], onAddTag, onRemoveTag }) {
  const [value, setValue] = useState('')

  function submitTag(event) {
    if (event.key !== 'Enter') return

    event.preventDefault()
    const name = value.trim()
    if (!name) return

    onAddTag(name)
    setValue('')
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-[#1e1e2e] bg-[#0f0f16] px-3 py-2">
      {tags.map((tag) => (
        <Badge key={tag.id || tag.name} className="bg-indigo-500/10 text-indigo-100">
          {tag.name}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={`Remove ${tag.name} tag`}
            onClick={() => onRemoveTag(tag)}
            className="h-4 w-4 rounded-full p-0 text-indigo-100/70 hover:bg-white/10 hover:text-white"
          >
            <X size={10} />
          </Button>
        </Badge>
      ))}
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={submitTag}
        placeholder="Add tag"
        className="min-w-24 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25"
      />
    </div>
  )
}

export default TagInput
