function buildPageList(page, totalPages) {
  const pages = []
  for (let i = 1; i <= totalPages; i += 1) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }
  return pages
}

export function Pagination({ page, totalPages, onPageChange, totalItems, pageSize }) {
  if (totalPages <= 1) return null

  const inicio = (page - 1) * pageSize + 1
  const fim = Math.min(page * pageSize, totalItems)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3">
      {typeof totalItems === 'number' && (
        <p className="text-xs font-semibold text-slate-500">Mostrando {inicio}-{fim} de {totalItems}</p>
      )}
      <div className="ml-auto flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          aria-label="Pagina anterior"
          className="h-8 w-8 shrink-0 rounded-md border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          &lsaquo;
        </button>

        <span className="px-2 text-sm font-bold text-slate-600 sm:hidden">
          {page} / {totalPages}
        </span>

        <div className="hidden items-center gap-1 sm:flex">
          {buildPageList(page, totalPages).map((item, index) => (
            item === '...'
              ? <span key={`dots-${index}`} className="px-1 text-sm font-bold text-slate-400">...</span>
              : (
                <button
                  key={item}
                  onClick={() => onPageChange(item)}
                  aria-current={item === page ? 'page' : undefined}
                  className={`h-8 w-8 rounded-md text-sm font-bold ${item === page ? 'bg-primary text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {item}
                </button>
              )
          ))}
        </div>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          aria-label="Proxima pagina"
          className="h-8 w-8 shrink-0 rounded-md border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          &rsaquo;
        </button>
      </div>
    </div>
  )
}
