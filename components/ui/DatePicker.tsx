'use client'

import * as React from 'react'
import { format, parse } from 'date-fns'
import { id } from 'date-fns/locale'
import { Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

/**
 * Date picker pola shadcn "Date of Birth":
 * https://ui.shadcn.com/docs/components/base/date-picker#date-of-birth
 * Value = ISO `YYYY-MM-DD`.
 */
export default function DatePicker({
  value,
  onChange,
  max,
  min,
}: {
  value: string
  onChange: (isoDate: string) => void
  max?: string
  min?: string
}) {
  const [open, setOpen] = React.useState(false)
  const selected = value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined

  const disabled = React.useMemo(() => {
    const list: Array<{ before: Date } | { after: Date }> = []
    if (min) list.push({ before: parse(min, 'yyyy-MM-dd', new Date()) })
    if (max) list.push({ after: parse(max, 'yyyy-MM-dd', new Date()) })
    return list.length ? list : undefined
  }, [min, max])

  return (
    <Popover modal open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          data-empty={!value}
          className={cn(
            'input-field h-auto w-full justify-start gap-2 font-normal hover:bg-white',
            !value && 'text-slate-400'
          )}
        >
          <CalendarIcon className="text-slate-400" />
          {selected ? format(selected, 'd MMMM yyyy', { locale: id }) : 'Pilih tanggal'}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          captionLayout="dropdown"
          startMonth={min ? parse(min, 'yyyy-MM-dd', new Date()) : new Date(2015, 0)}
          endMonth={max ? parse(max, 'yyyy-MM-dd', new Date()) : new Date()}
          disabled={disabled}
          onSelect={(date) => {
            if (!date) return
            onChange(format(date, 'yyyy-MM-dd'))
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
