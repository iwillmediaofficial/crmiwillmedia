/**
 * Lightweight, dependency-free RFC-4180 CSV export utility.
 * Optimizes bundle size for Vercel Free Tier hosting.
 */
export function exportToCsv(filename: string, rows: Record<string, any>[]) {
  if (!rows || !rows.length) {
    alert('No data available to export.')
    return
  }

  const separator = ','
  const keys = Object.keys(rows[0])

  const csvHeader = keys.map((key) => `"${key.replace(/"/g, '""')}"`).join(separator)

  const csvRows = rows.map((row) =>
    keys
      .map((key) => {
        let val = row[key]
        if (val === null || val === undefined) {
          return '""'
        }
        if (typeof val === 'object') {
          val = JSON.stringify(val)
        } else {
          val = String(val)
        }
        return `"${val.replace(/"/g, '""')}"`
      })
      .join(separator)
  )

  const csvContent = [csvHeader, ...csvRows].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })

  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
