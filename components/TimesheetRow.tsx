'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { TableCell, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Trash2, GripVertical, Edit2 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'

export function TimesheetRow({ rowData, rowIndex, updateRow, deleteRow, height, updateHeight, startDate }) {
  const [isEditing, setIsEditing] = useState(false)
  const rowRef = useRef(null)

  useEffect(() => {
    if (rowRef.current) {
      const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          updateHeight(entry.contentRect.height)
        }
      })

      resizeObserver.observe(rowRef.current)

      return () => {
        resizeObserver.disconnect()
      }
    }
  }, [updateHeight])

  const handleInputChange = (field, value, timeIndex = -1) => {
    const newData = { ...rowData }
    if (timeIndex === -1) {
      newData[field] = value
    } else {
      newData.times[timeIndex] = value
    }
    updateRow(rowIndex, newData)
  }

  const calculateRowTotal = () => {
    return rowData.times.reduce((sum, time) => {
      const [hours, minutes] = time.split(':').map(Number)
      return sum + (hours * 60) + minutes
    }, 0) / 60
  }

  const handleResize = (e) => {
    const startY = e.clientY
    const startHeight = rowRef.current.offsetHeight

    const onMouseMove = (moveEvent) => {
      const newHeight = startHeight + moveEvent.clientY - startY
      updateHeight(newHeight)
    }

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  const truncateText = (text, maxLength) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  return (
    <TableRow ref={rowRef} style={{ height }}>
      <TableCell>{rowIndex + 1}</TableCell>
      <TableCell>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="w-full justify-start p-2 h-auto">
              <div className="flex items-center space-x-2">
                <Edit2 className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{truncateText(rowData.account, 20)}</span>
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-2">
              <Label htmlFor={`account-${rowIndex}`}>Account / Customer</Label>
              <Textarea
                id={`account-${rowIndex}`}
                value={rowData.account}
                onChange={(e) => handleInputChange('account', e.target.value)}
                rows={3}
                className="w-full"
                placeholder="Enter account or customer name"
              />
            </div>
          </PopoverContent>
        </Popover>
      </TableCell>
      <TableCell>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="w-full justify-start p-2 h-auto">
              <div className="flex items-center space-x-2">
                <Edit2 className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{truncateText(rowData.task, 20)}</span>
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-2">
              <Label htmlFor={`task-${rowIndex}`}>Task Name</Label>
              <Textarea
                id={`task-${rowIndex}`}
                value={rowData.task}
                onChange={(e) => handleInputChange('task', e.target.value)}
                rows={3}
                className="w-full"
                placeholder="Enter task name or description"
              />
            </div>
          </PopoverContent>
        </Popover>
      </TableCell>
      {rowData.times.map((time, index) => (
        <TableCell key={index}>
          <div>
            <Input
              type="time"
              value={time}
              onChange={(e) => handleInputChange('times', e.target.value, index)}
              step="900"
              className="w-full"
            />
          </div>
        </TableCell>
      ))}
      <TableCell className="font-bold">{calculateRowTotal().toFixed(2)}</TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Button variant="destructive" size="icon" onClick={() => deleteRow(rowIndex)}>
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onMouseDown={handleResize} className="cursor-row-resize">
            <GripVertical className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

