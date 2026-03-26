'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { 
  CreditCard, 
  TrendingUp, 
  Calendar, 
  AlertTriangle, 
  ArrowRight,
  Receipt,
  Wallet,
  PiggyBank
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CardWidget } from '@/components/cards/card-widget'
import { SpendingChart } from '@/components/dashboard/spending-chart'
import { formatVND, getNextDateForDay, daysUntil, getUrgencyLevel, formatDateShort } from '@/lib/format'
import type { Card as CardType, Transaction, Installment } from '@/lib/types'

const fetchDashboardData = async () => {
  const supabase = createClient()
  
  const [cardsRes, transactionsRes, installmentsRes] = await Promise.all([
    supabase.from('cards').select('*').eq('is_active', true).order('created_at', { ascending: false }),
    supabase.from('transactions').select('*').order('transaction_date', { ascending: false }).limit(100),
    supabase.from('installments').select('*').eq('is_active', true),
  ])

  if (cardsRes.error) throw cardsRes.error
  if (transactionsRes.error) throw transactionsRes.error
  if (installmentsRes.error) throw installmentsRes.error

  return {
    cards: cardsRes.data as CardType[],
    transactions: transactionsRes.data as Transaction[],
    installments: installmentsRes.data as Installment[],
  }
}

export default function DashboardPage() {
  const { data, error, isLoading } = useSWR('dashboard', fetchDashboardData)

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive">Không thể tải dữ liệu</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[120px] rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[300px] rounded-xl" />
      </div>
    )
  }

  const { cards, transactions, installments } = data || { cards: [], transactions: [], installments: [] }

  // Calculate summary stats
  const totalBalance = cards.reduce((sum, card) => sum + card.current_balance, 0)
  const totalLimit = cards.reduce((sum, card) => sum + card.credit_limit, 0)
  const totalAvailable = cards.reduce((sum, card) => sum + card.available_credit, 0)
  const totalInstallmentMonthly = installments.reduce((sum, i) => sum + i.monthly_payment, 0)

  // Get cards with upcoming due dates
  const cardsWithDueDates = cards.map((card) => {
    const nextDueDate = getNextDateForDay(card.due_date)
    const days = daysUntil(nextDueDate)
    return { card, nextDueDate, days, urgency: getUrgencyLevel(days) }
  }).sort((a, b) => a.days - b.days)

  const urgentCards = cardsWithDueDates.filter((c) => c.urgency === 'critical' || c.urgency === 'warning')

  // Calculate this month's spending
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const thisMonthTransactions = transactions.filter((t) => new Date(t.transaction_date) >= thisMonthStart)
  const thisMonthSpending = thisMonthTransactions.reduce((sum, t) => sum + t.amount, 0)

  // Get recent transactions
  const recentTransactions = transactions.slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tổng quan</h1>
        <p className="text-muted-foreground">Chào mừng bạn quay trở lại</p>
      </div>

      {/* Urgent Alerts */}
      {urgentCards.length > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="size-5 text-yellow-500 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Sắp đến hạn thanh toán</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {urgentCards.length} thẻ cần thanh toán trong 7 ngày tới
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {urgentCards.map(({ card, days }) => (
                    <Badge 
                      key={card.id} 
                      variant={days <= 3 ? 'destructive' : 'secondary'}
                      className="flex items-center gap-1"
                    >
                      {card.card_name}: {days <= 0 ? 'Quá hạn' : `còn ${days} ngày`}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng dư nợ
            </CardTitle>
            <CreditCard className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{formatVND(totalBalance)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              trên {cards.length} thẻ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Hạn mức còn lại
            </CardTitle>
            <PiggyBank className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{formatVND(totalAvailable)}</p>
            <Progress 
              value={(totalAvailable / totalLimit) * 100} 
              className="h-1.5 mt-2"
              indicatorClassName="bg-green-500"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Chi tiêu tháng này
            </CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{formatVND(thisMonthSpending)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {thisMonthTransactions.length} giao dịch
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Trả góp hàng tháng
            </CardTitle>
            <Wallet className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{formatVND(totalInstallmentMonthly)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {installments.length} khoản
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cards Overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Thẻ của bạn</CardTitle>
              <CardDescription>Danh sách thẻ tín dụng</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/cards">
                Xem tất cả
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {cards.length > 0 ? (
              <div className="space-y-3">
                {cards.slice(0, 3).map((card) => {
                  const dueInfo = cardsWithDueDates.find((c) => c.card.id === card.id)
                  const utilizationPercent = card.credit_limit > 0 
                    ? (card.current_balance / card.credit_limit) * 100 
                    : 0

                  return (
                    <div 
                      key={card.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="size-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${card.card_color}20` }}
                        >
                          <CreditCard className="size-5" style={{ color: card.card_color }} />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{card.card_name}</p>
                          <p className="text-sm text-muted-foreground">{card.bank_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">{formatVND(card.current_balance)}</p>
                        <p className="text-xs text-muted-foreground">
                          {utilizationPercent.toFixed(0)}% sử dụng
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <CreditCard className="size-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Chưa có thẻ nào</p>
                <Button asChild className="mt-3">
                  <Link href="/cards">Thêm thẻ</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Giao dịch gần đây</CardTitle>
              <CardDescription>5 giao dịch mới nhất</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/transactions">
                Xem tất cả
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.map((tx) => {
                  const card = cards.find((c) => c.id === tx.card_id)
                  return (
                    <div 
                      key={tx.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-muted flex items-center justify-center">
                          <Receipt className="size-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {tx.merchant_name || 'Giao dịch'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDateShort(tx.transaction_date)}
                            {card && ` • ${card.card_name}`}
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold text-foreground">
                        {formatVND(tx.amount)}
                      </p>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Receipt className="size-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Chưa có giao dịch nào</p>
                <Button asChild className="mt-3">
                  <Link href="/transactions">Thêm giao dịch</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Spending Chart */}
      {transactions.length > 0 && (
        <SpendingChart transactions={transactions} />
      )}
    </div>
  )
}
