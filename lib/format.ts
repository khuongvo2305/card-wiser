// Vietnamese number and date formatting utilities

/**
 * Format number as Vietnamese currency (VND)
 * Uses dots as thousand separators and ₫ symbol
 */
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format number with Vietnamese thousand separators (dots)
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('vi-VN').format(num)
}

/**
 * Format date as DD/MM/YYYY (Vietnamese format)
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

/**
 * Format date as DD/MM (short format)
 */
export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  }).format(d)
}

/**
 * Format time as HH:mm
 */
export function formatTime(time: string | null): string {
  if (!time) return ''
  const [hours, minutes] = time.split(':')
  return `${hours}:${minutes}`
}

/**
 * Format date and time together
 */
export function formatDateTime(date: Date | string, time?: string | null): string {
  const formattedDate = formatDate(date)
  if (time) {
    return `${formattedDate} ${formatTime(time)}`
  }
  return formattedDate
}

/**
 * Get the next occurrence of a day of month
 */
export function getNextDateForDay(dayOfMonth: number): Date {
  const today = new Date()
  const currentDay = today.getDate()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  // Clamp day to valid range
  const maxDay = new Date(currentYear, currentMonth + 1, 0).getDate()
  const targetDay = Math.min(dayOfMonth, maxDay)

  if (currentDay <= targetDay) {
    // This month
    return new Date(currentYear, currentMonth, targetDay)
  } else {
    // Next month
    const nextMonth = currentMonth + 1
    const nextYear = nextMonth > 11 ? currentYear + 1 : currentYear
    const normalizedMonth = nextMonth > 11 ? 0 : nextMonth
    const nextMaxDay = new Date(nextYear, normalizedMonth + 1, 0).getDate()
    return new Date(nextYear, normalizedMonth, Math.min(dayOfMonth, nextMaxDay))
  }
}

/**
 * Calculate days until a date
 */
export function daysUntil(targetDate: Date): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(targetDate)
  target.setHours(0, 0, 0, 0)
  const diffTime = target.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Get urgency level based on days until due
 */
export function getUrgencyLevel(daysUntilDue: number | null): 'critical' | 'warning' | 'normal' {
  if (daysUntilDue === null) return 'normal'
  if (daysUntilDue <= 3) return 'critical'
  if (daysUntilDue <= 7) return 'warning'
  return 'normal'
}

/**
 * Get urgency color class
 */
export function getUrgencyColor(level: 'critical' | 'warning' | 'normal'): string {
  switch (level) {
    case 'critical':
      return 'text-red-500 bg-red-500/10'
    case 'warning':
      return 'text-yellow-500 bg-yellow-500/10'
    case 'normal':
      return 'text-green-500 bg-green-500/10'
  }
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Get relative time string
 */
export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Hôm nay'
  if (diffDays === 1) return 'Hôm qua'
  if (diffDays < 7) return `${diffDays} ngày trước`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`
  return `${Math.floor(diffDays / 365)} năm trước`
}

/**
 * Parse Vietnamese date string (DD/MM/YYYY) to Date
 */
export function parseVietnameseDate(dateStr: string): Date | null {
  const parts = dateStr.split('/')
  if (parts.length !== 3) return null
  const [day, month, year] = parts.map(Number)
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null
  return new Date(year, month - 1, day)
}
