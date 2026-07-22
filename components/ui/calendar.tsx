'use client'

import * as React from 'react'
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react'
import {
  DayButton,
  DayPicker,
  getDefaultClassNames,
} from 'react-day-picker'
import { id } from 'date-fns/locale'

import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'

/** Calendar shadcn — mendukung `captionLayout="dropdown"` (Date of Birth). */
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = 'label',
  buttonVariant = 'ghost',
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>['variant']
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      locale={id}
      className={cn(
        'group/calendar bg-white p-3 [--cell-size:2rem]',
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString('id-ID', { month: 'short' }),
        ...formatters,
      }}
      classNames={{
        root: cn('w-fit', defaultClassNames.root),
        months: cn('relative flex flex-col gap-4 md:flex-row', defaultClassNames.months),
        month: cn('flex w-full flex-col gap-4', defaultClassNames.month),
        nav: cn(
          'absolute inset-x-0 top-0 z-20 flex w-full items-center justify-between gap-1 pointer-events-none',
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          'size-[--cell-size] select-none p-0 pointer-events-auto aria-disabled:opacity-50',
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          'size-[--cell-size] select-none p-0 pointer-events-auto aria-disabled:opacity-50',
          defaultClassNames.button_next
        ),
        month_caption: cn(
          'relative z-30 flex h-[--cell-size] w-full items-center justify-center px-[--cell-size]',
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          'relative z-30 flex h-[--cell-size] w-full items-center justify-center gap-1.5 text-sm font-medium',
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          'relative z-30 inline-flex items-center rounded-md border border-slate-200 bg-white shadow-sm',
          'has-[:focus]:border-brand-500 has-[:focus]:ring-[3px] has-[:focus]:ring-brand-500/30',
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          'relative z-30 h-8 cursor-pointer rounded-md border-0 bg-transparent py-1 pl-2 pr-1 text-sm font-medium text-slate-900',
          defaultClassNames.dropdown
        ),
        caption_label: cn(
          'select-none font-medium',
          captionLayout === 'label'
            ? 'text-sm'
            : 'hidden',
          defaultClassNames.caption_label
        ),
        month_grid: cn('w-full border-collapse', defaultClassNames.month_grid),
        weekdays: cn('flex', defaultClassNames.weekdays),
        weekday: cn(
          'flex-1 select-none rounded-md text-[0.8rem] font-normal text-slate-500',
          defaultClassNames.weekday
        ),
        week: cn('mt-2 flex w-full', defaultClassNames.week),
        week_number_header: cn('w-[--cell-size] select-none', defaultClassNames.week_number_header),
        week_number: cn(
          'select-none text-[0.8rem] text-slate-500',
          defaultClassNames.week_number
        ),
        day: cn(
          'group/day relative aspect-square h-full w-full select-none p-0 text-center',
          defaultClassNames.day
        ),
        range_start: cn('rounded-l-md bg-brand-50', defaultClassNames.range_start),
        range_middle: cn('rounded-none', defaultClassNames.range_middle),
        range_end: cn('rounded-r-md bg-brand-50', defaultClassNames.range_end),
        today: cn(
          'rounded-md bg-brand-50 text-brand-800 data-[selected=true]:rounded-none',
          defaultClassNames.today
        ),
        outside: cn('text-slate-400 aria-selected:text-slate-400', defaultClassNames.outside),
        disabled: cn('text-slate-400 opacity-50', defaultClassNames.disabled),
        hidden: cn('invisible', defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...rootProps }) => (
          <div data-slot="calendar" ref={rootRef} className={cn(className)} {...rootProps} />
        ),
        Chevron: ({ className, orientation, ...chevronProps }) => {
          if (orientation === 'left') {
            return <ChevronLeftIcon className={cn('size-4', className)} {...chevronProps} />
          }
          if (orientation === 'right') {
            return <ChevronRightIcon className={cn('size-4', className)} {...chevronProps} />
          }
          return <ChevronDownIcon className={cn('size-4', className)} {...chevronProps} />
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...weekProps }) => (
          <td {...weekProps}>
            <div className="flex size-[--cell-size] items-center justify-center text-center">
              {children}
            </div>
          </td>
        ),
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames()
  const ref = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString('id-ID')}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        'flex aspect-square size-auto w-full min-w-[--cell-size] flex-col gap-1 font-normal leading-none',
        'data-[selected-single=true]:bg-brand-700 data-[selected-single=true]:text-white',
        'data-[range-middle=true]:bg-brand-50 data-[range-middle=true]:text-brand-800',
        'data-[range-start=true]:bg-brand-700 data-[range-start=true]:text-white',
        'data-[range-end=true]:bg-brand-700 data-[range-end=true]:text-white',
        'group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10',
        'group-data-[focused=true]/day:ring-[3px] group-data-[focused=true]/day:ring-brand-500/40',
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  )
}

Calendar.displayName = 'Calendar'

export { Calendar, CalendarDayButton }
