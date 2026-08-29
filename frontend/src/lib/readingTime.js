export function calculateReadingTime(wordCount) {
  return Math.ceil(Math.max(Number(wordCount) || 0, 0) / 200)
}
