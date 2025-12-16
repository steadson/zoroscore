'use client'

import { useState, useRef } from 'react'

interface FilterTabsProps {
  activeFilter: 'all' | 'live' | 'finished'
  onFilterChange: (filter: 'all' | 'live' | 'finished') => void
  onDateChange?: (date: Date | null) => void
  selectedDate?: Date | null
  counts: {
    all: number
    live: number
    finished: number
  }
}

export default function FilterTabs({ 
  activeFilter, 
  onFilterChange, 
  onDateChange, 
  selectedDate, 
  counts 
}: FilterTabsProps) {
  const dateInputRef = useRef<HTMLInputElement>(null)

  const tabs = [
  { id: 'live' as const, label: 'LIVE', count: counts.live },
    { id: 'all' as const, label: 'ALL', count: counts.all },
    
    { id: 'finished' as const, label: 'FINISHED', count: counts.finished },
  ]

  // Calculate date range: 7 days back, 5 days forward
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const minDate = new Date(today)
  minDate.setDate(today.getDate() - 7)

  const maxDate = new Date(today)
  maxDate.setDate(today.getDate() + 5)

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const handleDateButtonClick = () => {
    // Trigger the hidden date input click
    dateInputRef.current?.showPicker?.() || dateInputRef.current?.click()
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onDateChange) {
      const newDate = e.target.value ? new Date(e.target.value + 'T00:00:00') : null
      onDateChange(newDate)
    }
  }

  // Handle filter change and reset to today's date
  const handleFilterChange = (filter: 'all' | 'live' | 'finished') => {
    onFilterChange(filter)
    // Reset to today when clicking filter tabs
    if (onDateChange) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      onDateChange(today);
    }
  }

  // Check if selected date is today
  const isToday = selectedDate &&
    selectedDate.toISOString().split('T')[0] === today.toISOString().split('T')[0]

  // Calendar is active ONLY if date is NOT today
  const isCalendarActive = !isToday

  return (
    <div className="flex gap-2 overflow-x-auto  scrollbar-hide items-center">
      {/* Filter Tabs */}
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleFilterChange(tab.id)}
          className={`
            px-3 py-2 rounded-lg font-semibold text-xs whitespace-nowrap transition-all
            ${activeFilter === tab.id
              ? 'bg-zoro-yellow text-zoro-dark shadow-lg shadow-zoro-yellow/30'
              : 'bg-zoro-card text-zoro-grey border border-zoro-border hover:border-zoro-yellow/50 hover:text-zoro-white'
            }
          `}
        >
          <span className="flex items-center gap-1.5">
            {tab.id === 'live' && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zoro-green opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-zoro-green"></span>
              </span>
            )}
            {tab.label}
            {tab.id === 'live' && tab.count > 0 && (
              <span className={`
                ml-1 text-xs font-bold
                ${activeFilter === tab.id ? 'text-zoro-dark' : 'text-zoro-yellow'}
              `}>
                {tab.count}
              </span>
            )}
          </span>
        </button>
      ))}

      {/* Calendar Date Picker Button */}
      <button
        type="button"
        onClick={handleDateButtonClick}
        className={`
          px-3 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all
          flex items-center gap-2
          ${isCalendarActive
            ? 'bg-zoro-yellow text-zoro-dark shadow-lg shadow-zoro-yellow/30'
            : 'bg-zoro-card text-zoro-grey border border-zoro-border hover:border-zoro-yellow/50 hover:text-zoro-white'
          }
        `}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        {isCalendarActive && (
          <span className="text-xs font-bold">
            {selectedDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </button>

      {/* Hidden Date Input */}
      <input
        ref={dateInputRef}
        type="date"
        min={formatDateForInput(minDate)}
        max={formatDateForInput(maxDate)}
        value={selectedDate ? formatDateForInput(selectedDate) : formatDateForInput(today)}
        onChange={handleDateChange}
        className="sr-only"
      />
    </div>
  )
}