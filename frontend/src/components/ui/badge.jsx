import * as React from 'react'
import { cn } from '@/lib/utils'

function Badge({ className, ...props }) {
  return (
    <span
      data-slot="badge"
      className={cn(
        'inline-flex max-w-full items-center gap-1 rounded-md border border-white/10 bg-white/[0.06] px-2 py-0.5 text-xs font-medium text-slate-200',
        className
      )}
      {...props}
    />
  )
}

export { Badge }
