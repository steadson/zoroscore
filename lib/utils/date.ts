import { format, isValid } from 'date-fns'

export function parseLiveScoreDate(dateString: string | number): Date {
  const str = String(dateString)
  
  if (str.length !== 14) {
    throw new Error(`Invalid LiveScore date format: ${dateString}`)
  }

  const year = parseInt(str.substring(0, 4))
  const month = parseInt(str.substring(4, 6)) - 1
  const day = parseInt(str.substring(6, 8))
  const hour = parseInt(str.substring(8, 10))
  const minute = parseInt(str.substring(10, 12))
  const second = parseInt(str.substring(12, 14))

  const date = new Date(year, month, day, hour, minute, second)

  if (!isValid(date)) {
    throw new Error(`Invalid date created from: ${dateString}`)
  }

  return date
}

export function formatDateForLiveScore(date: Date): string {
  return format(date, 'yyyyMMdd')
}

export function getTodayLiveScoreFormat(): string {
  return formatDateForLiveScore(new Date())
}

/**
 * Parse match status from LiveScore API
 * FIXED: Now handles minute indicators like "37'", "45+2'"
 */
export function parseMatchStatus(eps: string): 'upcoming' | 'live' | 'halftime' | 'finished' | 'postponed' | 'cancelled' {
  const status = eps?.toUpperCase().trim()
  
  // Finished
  if (status === 'FT' || status === 'AET' || status === 'PEN') {
    return 'finished'
  }
  
  // Halftime
  if (status === 'HT') {
    return 'halftime'
  }
  
  // Live - check if it's a minute indicator (ends with ' or contains +)
  if (status.endsWith("'") || status.includes("'+")) {
    return 'live'
  }
  
  // Explicit live status
  if (status === 'LIVE' || status === '1H' || status === '2H') {
    return 'live'
  }
  
  // Not started
  if (status === 'NS' || status === 'TBA') {
    return 'upcoming'
  }
  
  // Postponed
  if (status === 'PST' || status === 'POSTPONED') {
    return 'postponed'
  }
  
  // Cancelled
  if (status === 'CANC' || status === 'ABD' || status === 'CANCELLED') {
    return 'cancelled'
  }
  
  return 'upcoming'
}

/**
 * Extract current minute from LiveScore status string
 * Examples: "37'" → 37, "45+2'" → 47, "90+4'" → 94
 */
export function extractMinuteFromStatus(eps: string): { minute: number; addedTime?: number } | undefined {
  if (!eps) return undefined
  
  const status = eps.trim()
  
  // Match patterns like "37'", "45+2'", "90+4'"
  const minuteMatch = status.match(/^(\d+)(?:\+(\d+))?'/)
  
  if (minuteMatch) {
    const minute = parseInt(minuteMatch[1])
    const addedTime = minuteMatch[2] ? parseInt(minuteMatch[2]) : undefined
    
    return { minute, addedTime }
  }
  
  return undefined
}
export function formatMatchMinute(minute?: number, addedTime?: number): string {
  if (minute === undefined) return ''
  
  if (addedTime) {
    return `${minute}+${addedTime}'`
  }
  
  return `${minute}'`
}
export function formatDisplayDate(date: Date): string {
  return format(date, 'MMM dd, yyyy')
}

export function formatDisplayTime(date: Date): string {
  return format(date, 'HH:mm')
}

export function isToday(date: Date): boolean {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

export function getDateRange(days: number = 1): string[] {
  const dates: string[] = []
  const today = new Date()
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    dates.push(formatDateForLiveScore(date))
  }
  
  return dates
}