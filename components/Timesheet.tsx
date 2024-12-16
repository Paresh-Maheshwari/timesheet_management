'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TimesheetRow } from './TimesheetRow'
import { exportToExcel, getMonday } from '@/app/utils/timesheetUtils'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'

const LOCAL_STORAGE_KEY = 'timesheetData'

export function Timesheet() {
  const [startDate, setStartDate] = useState(getMonday(new Date()))
  const [weekData, setWeekData] = useState({})
  const [rows, setRows] = useState([])
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const [deleteRowIndex, setDeleteRowIndex] = useState<number | null>(null)
  const [rowHeights, setRowHeights] = useState({})

  useEffect(() => {
    loadFromLocalStorage()
  }, [])

  useEffect(() => {
    saveToLocalStorage()
  }, [weekData, startDate, rowHeights])

  const loadFromLocalStorage = () => {
    const data = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}')
    setWeekData(data.weekData || {})
    setRows(data.weekData?.[startDate] || [])
    setRowHeights(data.rowHeights || {})
  }

  const saveToLocalStorage = () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ weekData, rowHeights }))
  }

  const addRow = () => {
    const newRows = [...(weekData[startDate] || []), { account: '', task: '', times: Array(7).fill('00:00') }]
    setWeekData({ ...weekData, [startDate]: newRows })
    setRows(newRows)
  }

  const updateRow = (index, newData) => {
    const updatedRows = [...(weekData[startDate] || [])]
    updatedRows[index] = newData
    setWeekData({ ...weekData, [startDate]: updatedRows })
    setRows(updatedRows)
  }

  const deleteRow = (index) => {
    setDeleteRowIndex(index)
  }

  const confirmDeleteRow = () => {
    if (deleteRowIndex !== null) {
      const updatedRows = (weekData[startDate] || []).filter((_, i) => i !== deleteRowIndex)
      setWeekData({ ...weekData, [startDate]: updatedRows })
      setRows(updatedRows)
      setDeleteRowIndex(null)
    }
  }

  const resetTable = () => {
    setIsResetDialogOpen(true)
  }

  const confirmResetTable = () => {
    const updatedWeekData = { ...weekData }
    delete updatedWeekData[startDate]
    setWeekData(updatedWeekData)
    setRows([])
    setIsResetDialogOpen(false)
  }

  const calculateDayTotals = () => {
    const dayTotals = Array(7).fill(0)
    rows.forEach(row => {
      row.times.forEach((time, index) => {
        const [hours, minutes] = time.split(':').map(Number)
        dayTotals[index] += (hours * 60) + minutes
      })
    })
    return dayTotals.map(total => (total / 60).toFixed(2))
  }

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const dayTotals = calculateDayTotals()
  const weeklyTotal = dayTotals.reduce((a, b) => parseFloat(a) + parseFloat(b), 0).toFixed(2)

  const updateRowHeight = (index, height) => {
    setRowHeights(prev => ({ ...prev, [index]: height }))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-2">
          <label htmlFor="startDate" className="whitespace-nowrap">Start Date (Monday):</label>
          <Input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => {
              const selectedDate = new Date(e.target.value)
              const newStartDate = getMonday(selectedDate)
              setStartDate(newStartDate)
              setRows(weekData[newStartDate] || [])
            }}
            className="w-40"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => exportToExcel(rows, weekDays, startDate, dayTotals, weeklyTotal)}>Export to Excel</Button>
          <Button variant="destructive" onClick={resetTable}>Reset</Button>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-20rem)] w-full rounded-md border">
        <div className="w-[1200px] md:w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Sr. No.</TableHead>
                <TableHead className="w-48">Account / Customer</TableHead>
                <TableHead className="w-48">Task Name</TableHead>
                {weekDays.map((day, index) => (
                  <TableHead key={day} className="w-24">
                    {day.slice(0, 3)}<br />
                    {new Date(new Date(startDate).setDate(new Date(startDate).getDate() + index)).toLocaleDateString()}
                  </TableHead>
                ))}
                <TableHead className="w-24">Total Hours</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => (
                <TimesheetRow
                  key={index}
                  rowData={row}
                  rowIndex={index}
                  updateRow={updateRow}
                  deleteRow={deleteRow}
                  height={rowHeights[index] || 'auto'}
                  updateHeight={(height) => updateRowHeight(index, height)}
                />
              ))}
              <TableRow>
                <TableCell colSpan={3} className="font-bold">Day Total</TableCell>
                {dayTotals.map((total, index) => (
                  <TableCell key={index}>{total}</TableCell>
                ))}
                <TableCell className="font-bold">{weeklyTotal}</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <Button onClick={addRow} className="mt-4">Add Row</Button>

      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Table</DialogTitle>
            <DialogDescription>
              Are you sure you want to reset the table? This will delete all data for the current week.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmResetTable}>Reset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteRowIndex !== null} onOpenChange={() => setDeleteRowIndex(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Row</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this row?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteRowIndex(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteRow}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

