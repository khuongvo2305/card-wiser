'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import { ChevronLeft, ChevronRight, CreditCard, Calendar as CalendarIcon, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatVND, formatDateShort, getUrgencyLevel } from '@/lib/format'
import type { Card as CardType, Installment } from '@/lib/types'
import { cn } from '@/lib/utils'

const fetchCalendarData = async () => {
  const supabase = createClient()
  
  const [cardsRes, installmentsRes] = await Promise.all([
    supabase.from('cards').select('*').eq('is_active', true),
    supabase.from('installments').select('*').eq('is_active', true),
  ])

  if (cardsRes.error) throw cardsRes.error
  if (installmentsRes.error) throw installmentsRes.error

  return {
    cards: cardsRes.data as CardType[],
    installments: installmentsRes.data as Installment[],
  }
}

interface CalendarEvent {
  id: string
  day: number
  type: 'due' | 'statement' | 'installment'
  title: string
  subtitle: string
  amount: number
  color: string
  urgency?: 'critical' | 'warning' | 'normal'
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const { data, error, isLoading } = useSWR('calendar', fetchCalendarData)

  const monthName = currentMonth.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const today = new Date()
  const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year

  const events = useMemo<CalendarEvent[]>(() => {
    if (!data) return []
    const { cards, installments } = data
    const eventList: CalendarEvent[] = []

    // Add card due dates and statement dates
    cards.forEach((card) => {
      // Due date
      eventList.push({
        id: `due-${card.id}`,
        day: card.due_date,
        type: 'due',
        title: card.card_name,
        subtitle: 'Ngày đến hạn',
        amount: card.current_balance,
        color: card.card_color,
      })

      // Statement date
      eventList.push({
        id: `statement-${card.id}`,
        day: card.statement_date,
        type: 'statement',
        title: card.card_name,
        subtitle: 'Ngày sao kê',
        amount: 0,
        color: card.card_color,
      })
    })

    // Add installment payments
    installments.forEach((inst) => {
      if (inst.next_payment_date) {
        const paymentDate = new Date(inst.next_payment_date)
        if (paymentDate.getMonth() === month && paymentDate.getFullYear() === year) {
          const card = cards.find((c) => c.id === inst.card_id)
          eventList.push({
            id: `installment-${inst.id}`,
            day: paymentDate.getDate(),
            type: 'installment',
            title: inst.merchant_name || 'Trả góp',
            subtitle: card?.card_name || 'Trả góp',
            amount: inst.monthly_payment,
            color: card?.card_color || '#6B7280',
          })
        }
      }
    })

    // Calculate urgency for due dates in current month
    if (isCurrentMonth) {
      eventList.forEach((event) => {
        if (event.type === 'due') {
          const dueDate = new Date(year, month, event.day)
          const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          event.urgency = getUrgencyLevel(diffDays)
        }
      })
    }

    return eventList
  }, [data, month, year, isCurrentMonth])

  const getEventsForDay = (day: number) => events.filter((e) => e.day === day)

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    setCurrentMonth(new Date())
  }

  // Get upcoming events
  const upcomingEvents = useMemo(() => {
    const todayDay = isCurrentMonth ? today.getDate() : 0
    return events
      .filter((e) => e.day >= todayDay && (e.type === 'due' || e.type === 'installment'))
      .sort((a, b) => a.day - b.day)
      .slice(0, 5)
  }, [events, isCurrentMonth])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive">Không thể tải lịch thanh toán</p>
      </div>
    )
  }

  const weekDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Lịch thanh toán</h1>
        <p className="text-muted-foreground">Theo dõi ngày đến hạn và sao kê</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon-sm" onClick={goToPreviousMonth}>
                <ChevronLeft className="size-4" />
              </Button>
              <Button variant="outline" size="icon-sm" onClick={goToNextMonth}>
                <ChevronRight className="size-4" />
              </Button>
              <h2 className="text-lg font-semibold capitalize">{monthName}</h2>
            </div>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Hôm nay
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[400px]" />
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {/* Week days header */}
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="p-2 text-center text-sm font-medium text-muted-foreground"
                  >
                    {day}
                  </div>
                ))}

                {/* Empty cells before first day */}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="p-2" />
                ))}

                {/* Days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const dayEvents = getEventsForDay(day)
                  const isToday = isCurrentMonth && day === today.getDate()
                  const hasDue = dayEvents.some((e) => e.type === 'due')
                  const hasStatement = dayEvents.some((e) => e.type === 'statement')
                  const hasInstallment = dayEvents.some((e) => e.type === 'installment')

                  return (
                    <div
                      key={day}
                      className={cn(
                        'min-h-[80px] p-1 border rounded-lg transition-colors',
                        isToday && 'bg-primary/10 border-primary',
                        !isToday && dayEvents.length > 0 && 'bg-muted/50'
                      )}
                    >
                      <div className={cn(
                        'text-sm font-medium p-1',
                        isToday && 'text-primary',
                        !isToday && 'text-foreground'
                      )}>
                        {day}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            className="size-2 rounded-full"
                            style={{ backgroundColor: event.color }}
                            title={`${event.title}: ${event.subtitle}`}
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{dayEvents.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="size-3 rounded-full bg-red-500" />
                <span>Ngày đến hạn</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="size-3 rounded-full bg-blue-500" />
                <span>Ngày sao kê</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="size-3 rounded-full bg-green-500" />
                <span>Trả góp</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="size-5" />
              Sắp tới
            </CardTitle>
            <CardDescription>
              Các khoản thanh toán trong tháng
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      'p-3 rounded-lg border',
                      event.urgency === 'critical' && 'border-red-500/50 bg-red-500/5',
                      event.urgency === 'warning' && 'border-yellow-500/50 bg-yellow-500/5'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="size-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${event.color}20` }}
                        >
                          {event.type === 'installment' ? (
                            <CreditCard className="size-4" style={{ color: event.color }} />
                          ) : (
                            <AlertCircle className="size-4" style={{ color: event.color }} />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">{event.title}</p>
                          <p className="text-xs text-muted-foreground">{event.subtitle}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Ngày {event.day}
                      </Badge>
                    </div>
                    {event.amount > 0 && (
                      <p className="mt-2 text-sm font-semibold text-foreground">
                        {formatVND(event.amount)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarIcon className="size-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Không có thanh toán sắp tới</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
