import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function pageWindow(page: number, totalPages: number): Array<number | 'gap'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pages = new Set<number>([1, totalPages, page, page - 1, page + 1])
  const normalized = [...pages].filter((value) => value >= 1 && value <= totalPages).sort((a, b) => a - b)

  const result: Array<number | 'gap'> = []
  for (const value of normalized) {
    const previous = result[result.length - 1]
    if (typeof previous === 'number' && value - previous > 1) result.push('gap')
    result.push(value)
  }
  return result
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  if (totalPages <= 1) return null

  return (
    <nav aria-label="Paginação do catálogo" className="mt-10 flex items-center justify-center gap-1.5">
      <Button
        variant="outline"
        size="icon"
        className="rounded-full"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Página anterior"
      >
        <ChevronLeft aria-hidden="true" />
      </Button>

      {pageWindow(page, totalPages).map((item, index) =>
        item === 'gap' ? (
          <span key={`gap-${index}`} className="text-muted-foreground px-1 text-xs" aria-hidden="true">
            …
          </span>
        ) : (
          <Button
            key={item}
            variant={item === page ? 'default' : 'outline'}
            size="icon"
            className={cn('rounded-full text-xs')}
            aria-label={`Página ${item}`}
            aria-current={item === page ? 'page' : undefined}
            onClick={() => onPageChange(item)}
          >
            {item}
          </Button>
        ),
      )}

      <Button
        variant="outline"
        size="icon"
        className="rounded-full"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        aria-label="Próxima página"
      >
        <ChevronRight aria-hidden="true" />
      </Button>
    </nav>
  )
}
