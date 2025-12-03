export type Column<T> = { key: keyof T | string; header: React.ReactNode; render?: (row: T) => React.ReactNode }

export default function DataTable<T extends { id?: string | number }>({ columns, data, rowClassName }: { columns: Column<T>[]; data: T[]; rowClassName?: (row: T) => string }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="min-w-full text-sm">
        <thead className="bg-muted">
          <tr>
            {columns.map((c) => (
              <th key={String(c.key)} className="text-left px-3 py-2 font-medium">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={(row.id ?? i) as React.Key} className={"border-t border-border " + (rowClassName ? rowClassName(row) : '')}>
              {columns.map((c) => (
                <td key={String(c.key)} className="px-3 py-2">
                  {c.render ? c.render(row) : (row as any)[c.key]}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td className="px-3 py-6 text-center text-muted-foreground" colSpan={columns.length}>
                Nenhum registro encontrado
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
