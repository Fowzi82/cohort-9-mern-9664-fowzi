import { Button } from './ui/button'

const NOTE_COLORS = [
  { value: 'default', label: 'Default', className: 'bg-slate-700' },
  { value: 'red', label: 'Red', className: 'bg-red-300' },
  { value: 'yellow', label: 'Yellow', className: 'bg-yellow-300' },
  { value: 'green', label: 'Green', className: 'bg-green-300' },
  { value: 'blue', label: 'Blue', className: 'bg-blue-300' },
  { value: 'purple', label: 'Purple', className: 'bg-purple-300' },
]

function ColorPicker({ value = 'default', onChange }) {
  return (
    <div className="flex items-center gap-1" aria-label="Note color">
      {NOTE_COLORS.map((color) => (
        <Button
          key={color.value}
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={`Set ${color.label.toLowerCase()} color`}
          aria-pressed={value === color.value}
          onClick={(event) => {
            event.stopPropagation()
            onChange(color.value)
          }}
          className="h-6 w-6 rounded-full p-0 hover:bg-white/10"
        >
          <span
            className={`block size-3.5 rounded-full ring-1 ring-white/20 ${color.className} ${
              value === color.value ? 'outline outline-2 outline-offset-2 outline-white/50' : ''
            }`}
          />
        </Button>
      ))}
    </div>
  )
}

export default ColorPicker
