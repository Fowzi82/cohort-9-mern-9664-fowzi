function slugify(value) {
  const slug = (value || 'untitled-note')
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || 'untitled-note'
}

function htmlToText(value) {
  if (!value) return ''

  const doc = new DOMParser().parseFromString(value, 'text/html')
  return doc.body.textContent.trim()
}

export function exportNoteAsMarkdown(title, content) {
  const markdown = typeof content === 'string' ? htmlToText(content) : content?.getText?.() || ''
  const blob = new Blob([markdown], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `${slugify(title)}.md`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  return { filename: link.download, markdown }
}
