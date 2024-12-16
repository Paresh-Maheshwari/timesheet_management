import * as XLSX from 'xlsx'

export function getMonday(d: Date): string {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(date.setDate(diff)).toISOString().split('T')[0]
}

export function exportToExcel(rows: any[], weekDays: string[], startDate: string, dayTotals: string[], weeklyTotal: string) {
  const wb = XLSX.utils.book_new()

  // Create header with dates
  const headerWithDates = weekDays.map((day, index) => {
    const date = new Date(new Date(startDate).setDate(new Date(startDate).getDate() + index))
    return `${day} (${date.toLocaleDateString()})`
  })

  const ws_data = [
    ['Sr. No.', 'Account / Customer', 'Task Name', ...headerWithDates, 'Total Hours']
  ]

  rows.forEach((row, index) => {
    const rowData = [
      index + 1,
      row.account,
      row.task,
      ...row.times,
      row.times.reduce((sum: number, time: string) => {
        const [hours, minutes] = time.split(':').map(Number)
        return sum + (hours + minutes / 60)
      }, 0).toFixed(2)
    ]
    ws_data.push(rowData)
  })

  // Add day totals row
  ws_data.push(['', 'Day Total', '', ...dayTotals, weeklyTotal])

  const ws = XLSX.utils.aoa_to_sheet(ws_data)
  XLSX.utils.book_append_sheet(wb, ws, 'Timesheet')

  // Generate Excel file
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' })

  // Convert to Blob
  const blob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' })

  // Create download link
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Timesheet_${startDate}.xlsx`
  a.click()

  // Clean up
  window.URL.revokeObjectURL(url)
}

// Helper function to convert string to ArrayBuffer
function s2ab(s: string) {
  const buf = new ArrayBuffer(s.length)
  const view = new Uint8Array(buf)
  for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF
  return buf
}

